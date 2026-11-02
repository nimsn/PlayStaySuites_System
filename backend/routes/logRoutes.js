const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');

const {authenticateToken, authorizeRoles} = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('Admin', 'Staff'), LogController.createLog);

router.get('/', authenticateToken, authorizeRoles('Admin', 'Staff'), LogController.getAuditReport);

router.get('/audit-report', authenticateToken, authorizeRoles('Admin', 'Staff'), LogController.getAuditReport);

module.exports = router;