const RoomModel = require('../models/RoomModel');


const handleError = (res, error, action) => {
    if (error.status) {
        return res.status(error.status).json({ message: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'That room number already exists.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'Invalid room type or staff id.' });
    }

    console.error(Error trying to ${action}:, error);
    return res.status(500).json({ message: Unable to ${action}. });
};


const isValidId = (id) => /^[1-9]\d*$/.test(String(id));


exports.getRooms = async (req, res) => {
    try {
        const rooms = await RoomModel.getAllRooms();

        res.status(200).json(rooms);
    } catch (error) {
        handleError(res, error, 'load rooms');
    }
};


exports.getRoomTypes = async (req, res) => {
    try {
        const types = await RoomModel.getRoomTypes();

        res.status(200).json(types);
    } catch (error) {
        handleError(res, error, 'load room types');
    }
};


exports.addRoom = async (req, res) => {
    try {
        const roomId = await RoomModel.createRoom(req.body || {});

        res.status(201).json({
            message: 'Room added successfully.',
            roomId
        });
    } catch (error) {
        handleError(res, error, 'add room');
    }
};


exports.editRoom = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: 'Please provide a valid room ID.'
            });
        }

        await RoomModel.updateRoom(Number(id), req.body || {});

        res.status(200).json({
            message: 'Room updated successfully.'
        });
    } catch (error) {
        handleError(res, error, 'update room');
    }
};


exports.changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, new_status, staff_id, remarks } = req.body || {};
        const newStatus = status || new_status;

        if (!isValidId(id) || !newStatus) {
            return res.status(400).json({
                message: 'A valid room ID and a status are required.'
            });
        }

        
        await RoomModel.updateRoomStatus(Number(id), newStatus, { staff_id, remarks });

        res.status(200).json({
            message: 'Room status updated successfully.'
        });
    } catch (error) {
        handleError(res, error, 'update room status');
    }
};


exports.removeRoom = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: 'Please provide a valid room ID.'
            });
        }

        await RoomModel.deleteRoom(Number(id));

        res.status(200).json({
            message: 'Room deleted successfully.'
        });
    } catch (error) {
        handleError(res, error, 'delete room');
    }
};


exports.getRoomReport = async (req, res) => {
    try {
        const report = await RoomModel.getRoomDetailsReport();

        res.status(200).json(report);
    } catch (error) {
        handleError(res, error, 'load room report');
    }
};