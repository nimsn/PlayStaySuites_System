const express = require('express');
const router = express.Router();
const bookingCtrl = require('../controllers/bookingController');

router.post('/', bookingCtrl.addBooking);
router.get('/reports/active', bookingCtrl.getBookingReport); 

module.exports = router;