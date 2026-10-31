const express = require('express');
const router = express.Router();

const LogController = require('../controllers/logController');

router.post('/', LogController.createLog);

router.get('/', LogController.getAuditReport);
router.get('/audit-report', LogController.getAuditReport);

module.exports = router;