const BookingModel = require('../models/BookingModel');

const fail = (res, err) => {
    if (err.status) return res.status(err.status).json({ message: err.message }); 
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Invalid user, room or staff id.' });
    console.error(err);
    res.status(500).json({ message: 'Something went wrong on the server.' });
};

exports.addBooking = async (req, res) => {
    try {
        const bookingData = { ...req.body };

        if (req.user.role === 'Student') {
            bookingData.user_id = req.user.user_id;

            bookingData.staff_id = null;
            bookingData.promo_code = null;
        }

        const { bookingId, total_amount, discount_amount } =
            await BookingModel.createBooking(bookingData);

        res.status(201).json({
            message: 'Booking created',
            bookingId,
            total_amount,
            discount_amount
        });
    } catch (err) {
        fail(res, err);
    }
};

exports.getBookings = async (req, res) => {
    try {
        let bookings;

        if (req.user.role === 'Student') {
            bookings = await BookingModel.getBookingsByUser(
                req.user.user_id
            );
        } else {
            bookings = await BookingModel.getAllBookings();
        }

        res.status(200).json(bookings);
    } catch (err) {
        fail(res, err);
    }
};

const auditContext = (req, reason) => ({
    actor: `${req.user.email} (${req.user.role})`,
    userId: req.user.user_id,
    reason,
});

exports.changeStatus = async (req, res) => {
    try {
        const { booking_status, reason } = req.body || {};
        const staffId = await BookingModel.findStaffId(req.user.user_id);
        await BookingModel.updateStatus(req.params.id, booking_status, staffId, auditContext(req, reason));
        res.status(200).json({ message: `Booking is now ${booking_status}` });
    } catch (err) {
        fail(res, err);
    }
};

exports.removeBooking = async (req, res) => {
    try {
        const reason = (req.body || {}).reason ?? req.query.reason;
        const staffId = await BookingModel.findStaffId(req.user.user_id);
        await BookingModel.updateStatus(req.params.id, 'Cancelled', staffId, auditContext(req, reason));
        res.status(200).json({ message: 'Booking cancelled', booking_status: 'Cancelled' });
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