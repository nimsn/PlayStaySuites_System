const LogModel = require('../models/LogModel');

exports.createLog = async (req, res) => {
    try {
        const { room_id, staff_id, prev_status, new_status, remarks } = req.body;
        await LogModel.addLog(room_id, staff_id, prev_status, new_status, remarks);
        res.status(201).json({ message: 'Log created' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAuditReport = async (req, res) => {
    try {
        const report = await LogModel.getAuditLogReport();
        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};