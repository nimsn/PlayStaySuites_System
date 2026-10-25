const db = require('../config/db');

const BillingModel = {
    createInvoice: async (bookingId, totalDue) => {
        const [result] = await db.query(
            'INSERT INTO invoices (booking_id, total_due, invoice_status) VALUES (?, ?, "Unpaid")',
            [bookingId, totalDue]
        );
        return result.insertId;
    },
    // MEMBER E's JOIN REPORT: FULL OUTER JOIN (Simulated via UNION)
    getBillingReport: async () => {
        const [rows] = await db.query(`
            SELECT i.invoice_id, i.total_due, i.invoice_status, p.payment_method, p.amount_paid
            FROM invoices i
            LEFT JOIN payments p ON i.invoice_id = p.invoice_id
            UNION
            SELECT i.invoice_id, i.total_due, i.invoice_status, p.payment_method, p.amount_paid
            FROM invoices i
            RIGHT JOIN payments p ON i.invoice_id = p.invoice_id
        `);
        return rows;
    }
};

module.exports = BillingModel;
