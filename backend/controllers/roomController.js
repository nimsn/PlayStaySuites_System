const RoomModel = require('../models/RoomModel');

exports.getRooms = async (req, res) => {
    try {
        const rooms = await RoomModel.getAllRooms();
        res.status(200).json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.changeStatus = async (req, res) => {
    try {
        await RoomModel.updateRoomStatus(req.params.id, req.body.status);
        res.status(200).json({ message: 'Status updated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getRoomReport = async (req, res) => {
    try {
        const report = await RoomModel.getRoomDetailsReport();
        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 