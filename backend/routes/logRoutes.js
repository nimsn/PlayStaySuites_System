const express = require('express');
const router = express.Router();
const logCtrl = require('../controllers/logController');

router.post('/', logCtrl.createLog);
router.get('/reports/audit', logCtrl.getAuditReport);

module.exports = router;