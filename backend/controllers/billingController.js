const BillingModel = require('../models/BillingModel');

const handleError = (res, err, action) => {
    if (err.status) {
        return res.status(err.status).json({ message: err.message });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'Booking or invoice not found.' });
    }

    console.error(Error trying to ${action}:, err);
    return res.status(500).json({ message: Unable to ${action}. });
};

exports.addInvoice = async (req, res) => {
    try {
        const { invoiceId, total_due } = await BillingModel.createInvoice((req.body || {}).booking_id);
        res.status(201).json({ message: 'Invoice generated', invoiceId, total_due });
    } catch (err) {
        handleError(res, err, 'generate invoice');
    }
};

exports.getInvoices = async (req, res) => {
    try {
        res.status(200).json(await BillingModel.getInvoices());
    } catch (err) {
        handleError(res, err, 'load invoices');
    }
};

exports.addPayment = async (req, res) => {
    try {
        const { paymentId, balance, invoice_status } = await BillingModel.recordPayment(req.body || {});
        res.status(201).json({ message: 'Payment recorded', paymentId, balance, invoice_status });
    } catch (err) {
        handleError(res, err, 'record payment');
    }
};

exports.getReconciliationReport = async (req, res) => {
    try {
        res.status(200).json(await BillingModel.getBillingReport());
    } catch (err) {
        handleError(res, err, 'load reconciliation report');
    }
};