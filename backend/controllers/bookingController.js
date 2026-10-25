const BookingModel = require('../models/BookingModel');

exports.addBooking = async (req, res) => {
    try {
        const id = await BookingModel.createBooking(req.body);
        res.status(201).json({ message: 'Booking created', bookingId: id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getBookingReport = async (req, res) => {
    try {
        const report = await BookingModel.getActiveBookingsReport();
        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};