const express = require('express');
const router = express.Router();

const bookingCtrl = require('../controllers/bookingController');
const {
    authenticateToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, bookingCtrl.getBookings);

router.get('/reports/active', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingCtrl.getBookingReport);

router.post('/', authenticateToken, bookingCtrl.addBooking);

router.patch('/:id/status', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingCtrl.changeStatus);

module.exports = router;