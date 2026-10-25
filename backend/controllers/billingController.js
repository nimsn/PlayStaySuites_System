const BillingModel = require('../models/BillingModel');

exports.addInvoice = async (req, res) => {
    try {
        const id = await BillingModel.createInvoice(req.body.booking_id, req.body.total_due);
        res.status(201).json({ message: 'Invoice generated', invoiceId: id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getReconciliationReport = async (req, res) => {
    try {
        const report = await BillingModel.getBillingReport();
        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};