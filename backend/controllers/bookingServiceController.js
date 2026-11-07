const Model = require('../models/BookingServiceModel');

const fail = (res, e, action) => {
    if (e.status) return res.status(e.status).json({ message: e.message });
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Invalid booking or service id.' });
    console.error(`Booking service ${action} failed:`, e);
    return res.status(500).json({ message: `Unable to ${action} booking service.` });
};

const staleInvoiceHint = (invoiceId) =>
    invoiceId ? `Invoice #${invoiceId} is now out of date. Use Recalculate on the Invoices page.` : undefined;

exports.list = async (req, res) => {
    try { res.json(await Model.list(req.params.id)); } catch (e) { fail(res, e, 'load'); }
};

exports.add = async (req, res) => {
    try {
        const r = await Model.add(req.params.id, req.body || {});
        res.status(201).json({ message: 'Service added to booking.', ...r, hint: staleInvoiceHint(r.invoice_id) });
    } catch (e) { fail(res, e, 'add'); }
};

exports.remove = async (req, res) => {
    try {
        const r = await Model.remove(req.params.id, req.params.lineId);
        res.json({ message: 'Service removed from booking.', hint: staleInvoiceHint(r.invoice_id) });
    } catch (e) { fail(res, e, 'remove'); }
};
