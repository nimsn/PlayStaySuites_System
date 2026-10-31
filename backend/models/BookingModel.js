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

const BookingModel = {
    BookingError,

    createBooking: async ({ user_id, room_id, staff_id = null, check_in_time, check_out_time }) => {
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
                `SELECT r.current_status, t.base_rate
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
            const total_amount = hours * Number(room.base_rate);

            const [result] = await conn.query(
                `INSERT INTO bookings (user_id, room_id, staff_id, check_in_time, check_out_time, total_amount, booking_status)
                 VALUES (?, ?, ?, ?, ?, ?, 'Reserved')`,
                [user_id, room_id, staff_id, inAt, outAt, total_amount]
            );

            await conn.commit();
            return { bookingId: result.insertId, total_amount };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    updateStatus: async (bookingId, newStatus, staffId = null) => {
        if (!Object.keys(FLOW).includes(newStatus)) throw new BookingError('Invalid booking_status.');

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[booking]] = await conn.query(
                'SELECT booking_id, room_id, booking_status FROM bookings WHERE booking_id = ? FOR UPDATE',
                [bookingId]
            );
            if (!booking) throw new BookingError('Booking not found.', 404);
            if (!FLOW[booking.booking_status].includes(newStatus)) {
                throw new BookingError(`A ${booking.booking_status} booking cannot become ${newStatus}.`, 409);
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
                   b.total_amount, b.booking_status
            FROM bookings b
            INNER JOIN users u ON b.user_id = u.user_id
            INNER JOIN rooms r ON b.room_id = r.room_id
            ORDER BY b.check_in_time DESC
        `);
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