const LogModel = require('../models/LogModel');

const handleError = (res, err, action) => {
    if (err.status) {
        return res.status(err.status).json({ message: err.message });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'Invalid room or staff id.' });
    }

    console.error(Error `trying to ${action}:`, err);
    return res.status(500).json({ message: `Failed to ${action}.` });
};

exports.createLog = async (req, res) => {
    try {
        const { room_id, staff_id, new_status, remarks } = req.body || {};

        const logId = await LogModel.addLog({ room_id, staff_id, new_status, remarks });

        res.status(201).json({
            message: 'Log record created successfully.',
            logId
        });
    } catch (err) {
        handleError(res, err, 'create log record');
    }
};

exports.getAuditReport = async (req, res) => {
    try {
        const report = await LogModel.getAuditLogReport();

        res.status(200).json(report);
    } catch (err) {
        handleError(res, err, 'retrieve audit report');
    }
};