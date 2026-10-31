const BookingModel = require('../models/BookingModel');

const fail = (res, err) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Invalid user, room or staff id.' });
    console.error(err);
    res.status(500).json({ message: 'Something went wrong on the server.' });
};

exports.addBooking = async (req, res) => {
    try {
        const { bookingId, total_amount } = await BookingModel.createBooking(req.body || {});
        res.status(201).json({ message: 'Booking created', bookingId, total_amount });
    } catch (err) {
        fail(res, err);
    }
};

exports.getBookings = async (req, res) => {
    try {
        res.status(200).json(await BookingModel.getAllBookings());
    } catch (err) {
        fail(res, err);
    }
};

exports.changeStatus = async (req, res) => {
    try {
        const { booking_status, staff_id } = req.body || {};
        await BookingModel.updateStatus(req.params.id, booking_status, staff_id);
        res.status(200).json({ message: `Booking is now ${booking_status}` });
    } catch (err) {
        fail(res, err);
    }
};

exports.getBookingReport = async (req, res) => {
    try {
        res.status(200).json(await BookingModel.getActiveBookingsReport());
    } catch (err) {
        fail(res, err);
    }
};