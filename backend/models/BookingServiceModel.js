const db = require('../config/db');

class BookingServiceError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;
const toCents = (v) => Math.round(Number(v) * 100);

const assertEditable = async (conn, bookingId) => {
    const [[booking]] = await conn.query('SELECT booking_status FROM bookings WHERE booking_id = ? FOR UPDATE', [bookingId]);
    if (!booking) throw new BookingServiceError('Booking not found.', 404);
    if (!['Reserved', 'Active'].includes(booking.booking_status)) {
        throw new BookingServiceError(`Services cannot be changed on a ${booking.booking_status} booking.`, 409);
    }
    const [[invoice]] = await conn.query(
        "SELECT invoice_id, invoice_status FROM invoices WHERE booking_id = ? AND invoice_status <> 'Void' ORDER BY invoice_id DESC LIMIT 1",
        [bookingId]
    );
    if (invoice && invoice.invoice_status !== 'Unpaid') {
        throw new BookingServiceError(`Invoice #${invoice.invoice_id} is already ${invoice.invoice_status}, so services can't be changed.`, 409);
    }
    return invoice ? invoice.invoice_id : null;
};

module.exports = {
    BookingServiceError,

    list: async (bookingId) => {
        if (!isId(bookingId)) throw new BookingServiceError('A valid booking id is required.');
        const [[booking]] = await db.query('SELECT booking_id FROM bookings WHERE booking_id = ?', [bookingId]);
        if (!booking) throw new BookingServiceError('Booking not found.', 404);

        const [rows] = await db.query(
            `SELECT bs.booking_service_id, bs.service_id, s.service_name, s.category,
                    s.unit_price, bs.quantity, bs.subtotal
             FROM booking_services bs
             INNER JOIN services s ON s.service_id = bs.service_id
             WHERE bs.booking_id = ?
             ORDER BY bs.booking_service_id`,
            [bookingId]
        );
        return rows;
    },

    add: async (bookingId, { service_id, quantity = 1 } = {}) => {
        if (!isId(bookingId)) throw new BookingServiceError('A valid booking id is required.');
        if (!isId(service_id)) throw new BookingServiceError('A valid service_id is required.');
        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new BookingServiceError('quantity must be a whole number from 1 to 99.');

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const invoiceId = await assertEditable(conn, bookingId);

            const [[service]] = await conn.query('SELECT service_name, unit_price FROM services WHERE service_id = ?', [service_id]);
            if (!service) throw new BookingServiceError('Service not found.', 404);

            const subtotal = (toCents(service.unit_price) * qty) / 100;
            const [result] = await conn.query(
                'INSERT INTO booking_services (booking_id, service_id, quantity, subtotal) VALUES (?, ?, ?, ?)',
                [bookingId, service_id, qty, subtotal]
            );

            await conn.commit();
            return { bookingServiceId: result.insertId, service_name: service.service_name, quantity: qty, subtotal, invoice_id: invoiceId };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    remove: async (bookingId, lineId) => {
        if (!isId(bookingId) || !isId(lineId)) throw new BookingServiceError('A valid booking id and line id are required.');

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const invoiceId = await assertEditable(conn, bookingId);

            const [result] = await conn.query(
                'DELETE FROM booking_services WHERE booking_service_id = ? AND booking_id = ?',
                [lineId, bookingId]
            );
            if (!result.affectedRows) throw new BookingServiceError('That service line is not on this booking.', 404);

            await conn.commit();
            return { invoice_id: invoiceId };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },
};