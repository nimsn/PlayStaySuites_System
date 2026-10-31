const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');

router.get('/', bookingCtrl.getBookings);
router.get('/reports/active', bookingCtrl.getBookingReport);
router.post('/', bookingCtrl.addBooking);
router.patch('/:id/status', bookingCtrl.changeStatus);

module.exports = router;