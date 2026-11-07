const express = require('express');
const router = express.Router();

const bookingCtrl = require('../controllers/bookingController');
const bookingServiceCtrl = require('../controllers/bookingServiceController');
const {
    authenticateToken,
    authorizeRoles
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, bookingCtrl.getBookings);

router.get('/reports/active', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingCtrl.getBookingReport);

router.post('/', authenticateToken, bookingCtrl.addBooking);

router.patch('/:id/status', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingCtrl.changeStatus);

router.delete('/:id', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingCtrl.removeBooking);

router.get('/:id/services', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingServiceCtrl.list);
router.post('/:id/services', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingServiceCtrl.add);
router.delete('/:id/services/:lineId', authenticateToken, authorizeRoles('Admin', 'Staff'), bookingServiceCtrl.remove);

module.exports = router;