const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');
const {authenticateToken, authorizeRoles} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, roomController.getRooms);
router.get('/types', authenticateToken, roomController.getRoomTypes);
router.get('/reports/details', authenticateToken, authorizeRoles('Admin', 'Staff'), roomController.getRoomReport);

router.post('/', authenticateToken, authorizeRoles('Admin', 'Staff'), roomController.addRoom);

router.put('/:id', authenticateToken, authorizeRoles('Admin', 'Staff'), roomController.editRoom);

router.patch('/:id/status', authenticateToken, authorizeRoles('Admin', 'Staff'), roomController.changeStatus);

router.delete('/:id', authenticateToken, authorizeRoles('Admin', 'Staff'), roomController.removeRoom);

module.exports = router;