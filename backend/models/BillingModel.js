const db = require('../config/db'); // mysql2 promise pool

class BillingError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAYMENT_METHODS = ['Cash', 'GCash', 'Credit Card'];

const toCents = (v) => Math.round(Number(v) * 100);
const peso = (cents) => ₱${(cents / 100).toFixed(2)};
const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const BillingModel = {
    BillingError,
    PAYMENT_METHODS,

    createInvoice: async (bookingId) => {
        if (!isId(bookingId)) throw new BillingError('A valid booking_id is required.');

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[booking]] = await conn.query(
                `SELECT b.total_amount, b.booking_status,
                        COALESCE((SELECT SUM(bs.subtotal) FROM booking_services bs WHERE bs.booking_id = b.booking_id), 0) AS services_total
                 FROM bookings b
                 WHERE b.booking_id = ? FOR UPDATE`,
                [bookingId]
            );
            if (!booking) throw new BillingError('Booking not found.', 404);
            if (booking.booking_status === 'Cancelled') throw new BillingError('A cancelled booking cannot be invoiced.', 409);

            const [existing] = await conn.query('SELECT invoice_id FROM invoices WHERE booking_id = ? LIMIT 1', [bookingId]);
            if (existing.length) {
                throw new BillingError(Booking #${bookingId} already has invoice #${existing[0].invoice_id}., 409);
            }

            const totalDue = (toCents(booking.total_amount) + toCents(booking.services_total)) / 100;
            const [result] = await conn.query('INSERT INTO invoices (booking_id, total_due) VALUES (?, ?)', [bookingId, totalDue]);

            await conn.commit();
            return { invoiceId: result.insertId, total_due: totalDue };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    recordPayment: async ({ invoice_id, amount_paid, payment_method }) => {
        if (!isId(invoice_id)) throw new BillingError('A valid invoice_id is required.');
        const amount = Number(amount_paid);
        if (!Number.isFinite(amount) || amount <= 0) throw new BillingError('amount_paid must be greater than zero.');
        if (!PAYMENT_METHODS.includes(payment_method)) {
            throw new BillingError(payment_method must be one of: ${PAYMENT_METHODS.join(', ')}.);
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[invoice]] = await conn.query(
                'SELECT total_due, invoice_status FROM invoices WHERE invoice_id = ? FOR UPDATE',
                [invoice_id]
            );
            if (!invoice) throw new BillingError('Invoice not found.', 404);
            if (invoice.invoice_status !== 'Unpaid') {
                throw new BillingError(This invoice is already ${invoice.invoice_status}., 409);
            }

            const [[{ paid }]] = await conn.query(
                'SELECT COALESCE(SUM(amount_paid), 0) AS paid FROM payments WHERE invoice_id = ?',
                [invoice_id]
            );

            const balance = toCents(invoice.total_due) - toCents(paid);
            const payment = toCents(amount);
            if (payment > balance) throw new BillingError(Payment is more than the balance of ${peso(balance)}., 409);

            const [result] = await conn.query(
                'INSERT INTO payments (invoice_id, payment_method, amount_paid) VALUES (?, ?, ?)',
                [invoice_id, payment_method, payment / 100]
            );

            const remaining = balance - payment;
            if (remaining === 0) {
                await conn.query("UPDATE invoices SET invoice_status = 'Paid' WHERE invoice_id = ?", [invoice_id]);
            }

            await conn.commit();
            return { paymentId: result.insertId, balance: remaining / 100, invoice_status: remaining === 0 ? 'Paid' : 'Unpaid' };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    getInvoices: async () => {
        const [rows] = await db.query(`
            SELECT i.invoice_id, i.booking_id, i.issued_at, i.total_due, i.invoice_status,
                   CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                   r.room_number,
                   COALESCE(SUM(p.amount_paid), 0) AS amount_paid
            FROM invoices i
            INNER JOIN bookings b ON b.booking_id = i.booking_id
            INNER JOIN users u ON u.user_id = b.user_id
            INNER JOIN rooms r ON r.room_id = b.room_id
            LEFT JOIN payments p ON p.invoice_id = i.invoice_id
            GROUP BY i.invoice_id, i.booking_id, i.issued_at, i.total_due, i.invoice_status,
                     u.first_name, u.last_name, r.room_number
            ORDER BY i.issued_at DESC, i.invoice_id DESC
        `);
        return rows;
    },

    getBillingReport: async () => {
        const [rows] = await db.query(`
            SELECT i.invoice_id, i.total_due, i.invoice_status,
                   p.payment_id, p.payment_method, p.amount_paid, p.paid_at
            FROM invoices i
            LEFT JOIN payments p ON i.invoice_id = p.invoice_id
            UNION
            SELECT i.invoice_id, i.total_due, i.invoice_status,
                   p.payment_id, p.payment_method, p.amount_paid, p.paid_at
            FROM invoices i
            RIGHT JOIN payments p ON i.invoice_id = p.invoice_id
            ORDER BY invoice_id, paid_at
        `);
        return rows;
    },
};

module.exports = BillingModel;
