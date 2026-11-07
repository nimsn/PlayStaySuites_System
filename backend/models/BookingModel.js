const db = require('../config/db');

class BookingError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const FLOW = {
    Reserved: ['Active', 'Cancelled'],
    Active: ['Completed'],
    Completed: [],
    Cancelled: [],
};

const toSql = (v) => {
    const s = String(v).replace('T', ' ').slice(0, 19);
    return s.length === 16 ? s + ':00' : s;
};
const toDate = (sql) => new Date(sql.replace(' ', 'T'));

const cancelInTx = async (conn, booking, staffId, { actor = 'staff', userId = null, reason = null } = {}) => {
    const bookingId = booking.booking_id;

    const [invoices] = await conn.query(
        "SELECT invoice_id FROM invoices WHERE booking_id = ? AND invoice_status <> 'Void' FOR UPDATE",
        [bookingId]
    );
    for (const inv of invoices) {
        const [[{ paid }]] = await conn.query(
            'SELECT COALESCE(SUM(amount_paid), 0) AS paid FROM payments WHERE invoice_id = ?',
            [inv.invoice_id]
        );
        if (Number(paid) > 0) {
            throw new BookingError(`Invoice #${inv.invoice_id} already has payments. Refund it before cancelling booking #${bookingId}.`, 409);
        }
    }
    for (const inv of invoices) {
        await conn.query(
            `UPDATE invoices SET invoice_status = 'Void', voided_at = NOW(), voided_by = ?, void_reason = ?
             WHERE invoice_id = ?`,
            [userId, `Booking #${bookingId} cancelled`, inv.invoice_id]
        );
    }

    await conn.query("UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?", [bookingId]);

    const note = reason === null || reason === undefined ? '' : String(reason).trim();
    await conn.query(
        `INSERT INTO room_status_logs (room_id, staff_id, previous_status, new_status, remarks)
         VALUES (?, ?, ?, ?, ?)`,
        [
            booking.room_id,
            staffId,
            booking.booking_status,
            'Cancelled',
            `Booking #${bookingId} cancelled by ${actor}${note ? `: ${note}` : ''}`.slice(0, 500),
        ]
    );
};

const BookingModel = {
    BookingError,

    createBooking: async ({ user_id, room_id, staff_id = null, check_in_time, check_out_time, promo_code = null }) => {
        if (!user_id || !room_id || !check_in_time || !check_out_time) {
            throw new BookingError('user_id, room_id, check_in_time and check_out_time are required.');
        }
        const inAt = toSql(check_in_time);
        const outAt = toSql(check_out_time);
        const start = toDate(inAt);
        const end = toDate(outAt);
        if (isNaN(start) || isNaN(end)) throw new BookingError('Invalid date or time.');
        if (end <= start) throw new BookingError('check_out_time must be after check_in_time.');

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[room]] = await conn.query(
                `SELECT r.current_status, t.type_name, t.base_rate_per_hour AS base_rate
                 FROM rooms r
                 INNER JOIN room_types t ON t.room_type_id = r.room_type_id
                 WHERE r.room_id = ? FOR UPDATE`,
                [room_id]
            );
            if (!room) throw new BookingError('Room not found.', 404);
            if (room.current_status === 'Maintenance') throw new BookingError('Room is under maintenance.', 409);

            const [[user]] = await conn.query('SELECT user_id FROM users WHERE user_id = ?', [user_id]);
            if (!user) throw new BookingError('User not found.', 404);

            const [clash] = await conn.query(
                `SELECT booking_id FROM bookings
                 WHERE room_id = ? AND booking_status IN ('Reserved', 'Active')
                   AND check_in_time < ?
                   AND COALESCE(check_out_time, '9999-12-31 23:59:59') > ?
                 LIMIT 1`,
                [room_id, outAt, inAt]
            );
            if (clash.length) {
                throw new BookingError(`Room is already booked for that time (booking #${clash[0].booking_id}).`, 409);
            }

            const hours = Math.max(1, Math.ceil((end - start) / 36e5));
            const baseCents = hours * Math.round(Number(room.base_rate) * 100);
            let promoId = null;
            let discountCents = 0;

            if (promo_code) {
                const [[promo]] = await conn.query(
                    `SELECT promo_id, discount_percentage, valid_from, valid_until
                     FROM promos WHERE promo_code = ? FOR UPDATE`,
                    [String(promo_code).trim()]
                );
                if (!promo) throw new BookingError('The selected promotion does not exist.');
                const now = new Date();
                if ((promo.valid_from && now < new Date(promo.valid_from)) ||
                    (promo.valid_until && now > new Date(promo.valid_until))) {
                    throw new BookingError('The selected promotion is not currently valid.');
                }
                const code = String(promo_code).trim().toUpperCase();
                const percent = Number(promo.discount_percentage);
                if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
                    throw new BookingError('The selected promotion has an invalid discount.');
                }

                if (code === 'WKDYS') {
                    const weekday = start.getDay();
                    const startsAt = start.getHours() * 60 + start.getMinutes();
                    const endsAt = end.getHours() * 60 + end.getMinutes();
                    const sameDay = start.toDateString() === end.toDateString();
                    if (room.type_name !== 'KTV Room' || weekday < 1 || weekday > 4 ||
                        !sameDay || startsAt < 13 * 60 || endsAt > 21 * 60) {
                        throw new BookingError('WKDYS is valid only for KTV bookings from Monday to Thursday, 1 PM to 9 PM.');
                    }
                }

                if (code === 'PLSR' || code === 'ARCD') {
                    throw new BookingError(`${code} applies to a specific amenity/add-on, not the room rental. Staff must add the eligible item before this promotion can be supported.`);
                }

                promoId = promo.promo_id;
                discountCents = Math.round(baseCents * percent / 100);
            }

            const totalCents = Math.max(0, baseCents - discountCents);
            const total_amount = totalCents / 100;
            const discount_amount = discountCents / 100;

            const [result] = await conn.query(
                `INSERT INTO bookings
                    (user_id, room_id, staff_id, check_in_time, check_out_time,
                     total_amount, promo_id, discount_amount, booking_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Reserved')`,
                [user_id, room_id, staff_id, inAt, outAt, total_amount, promoId, discount_amount]
            );

            await conn.commit();
            return { bookingId: result.insertId, total_amount, discount_amount };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    findStaffId: async (userId) => {
        const [[row]] = await db.query('SELECT staff_id FROM staff WHERE user_id = ? LIMIT 1', [userId]);
        return row ? row.staff_id : null;
    },

    updateStatus: async (bookingId, newStatus, staffId = null, ctx = {}) => {
        if (!Object.keys(FLOW).includes(newStatus)) throw new BookingError('Invalid booking_status.');

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[booking]] = await conn.query(
                'SELECT booking_id, room_id, booking_status FROM bookings WHERE booking_id = ? FOR UPDATE',
                [bookingId]
            );
            if (!booking) throw new BookingError('Booking not found.', 404);
            if (booking.booking_status === newStatus) {
                throw new BookingError(`Booking #${booking.booking_id} is already ${newStatus}.`, 409);
            }
            if (!FLOW[booking.booking_status].includes(newStatus)) {
                throw new BookingError(`A ${booking.booking_status} booking cannot become ${newStatus}.`, 409);
            }

            if (newStatus === 'Cancelled') {
                await cancelInTx(conn, booking, staffId, ctx);
                await conn.commit();
                return;
            }

            const [[room]] = await conn.query('SELECT current_status FROM rooms WHERE room_id = ? FOR UPDATE', [booking.room_id]);

            let roomStatus = null;
            if (newStatus === 'Active') {
                if (room.current_status !== 'Available') {
                    throw new BookingError(`Room is ${room.current_status} right now, so it can't be checked in.`, 409);
                }
                roomStatus = 'Occupied';
            } else if (newStatus === 'Completed') {
                roomStatus = 'Cleaning';
            }

            await conn.query('UPDATE bookings SET booking_status = ? WHERE booking_id = ?', [newStatus, bookingId]);

            if (roomStatus) {
                await conn.query('UPDATE rooms SET current_status = ? WHERE room_id = ?', [roomStatus, booking.room_id]);
                await conn.query(
                    `INSERT INTO room_status_logs (room_id, staff_id, previous_status, new_status, remarks)
                     VALUES (?, ?, ?, ?, ?)`,
                    [booking.room_id, staffId, room.current_status, roomStatus, `Booking #${bookingId} ${newStatus.toLowerCase()}`]
                );
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    getAllBookings: async () => {
        const [rows] = await db.query(`
            SELECT b.booking_id, b.user_id, b.room_id, b.staff_id,
                   CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                   r.room_number, b.check_in_time, b.check_out_time,
                   b.total_amount, b.promo_id, p.promo_code, b.discount_amount, b.booking_status,
                   COALESCE((SELECT SUM(bs.subtotal) FROM booking_services bs WHERE bs.booking_id = b.booking_id), 0) AS services_total
            FROM bookings b
            INNER JOIN users u ON b.user_id = u.user_id
            INNER JOIN rooms r ON b.room_id = r.room_id
            LEFT JOIN promos p ON p.promo_id = b.promo_id
            ORDER BY b.check_in_time DESC
        `);
        return rows;
    },
    getBookingsByUser: async (userId) => {
        const [rows] = await db.query(`
            SELECT b.booking_id, b.user_id, b.room_id, b.staff_id,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                r.room_number, b.check_in_time, b.check_out_time,
                b.total_amount, b.promo_id, p.promo_code, b.discount_amount, b.booking_status,
                COALESCE((SELECT SUM(bs.subtotal) FROM booking_services bs WHERE bs.booking_id = b.booking_id), 0) AS services_total
            FROM bookings b
            INNER JOIN users u ON b.user_id = u.user_id
            INNER JOIN rooms r ON b.room_id = r.room_id
            LEFT JOIN promos p ON p.promo_id = b.promo_id
            WHERE b.user_id = ?
            ORDER BY b.check_in_time DESC
        `, [userId]);

        return rows;
    },
    getActiveBookingsReport: async () => {
        const [rows] = await db.query(`
            SELECT b.booking_id, CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                   r.room_number, b.check_in_time, b.check_out_time, b.booking_status
            FROM bookings b
            INNER JOIN users u ON b.user_id = u.user_id
            INNER JOIN rooms r ON b.room_id = r.room_id
            WHERE b.booking_status = 'Active'
            ORDER BY b.check_in_time
        `);
        return rows;
    },
};

module.exports = BookingModel;
