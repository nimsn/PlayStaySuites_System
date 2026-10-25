const express = require('express');
const router = express.Router();
const roomCtrl = require('../controllers/roomController');

router.get('/', roomCtrl.getRooms);
router.patch('/:id/status', roomCtrl.changeStatus);
router.get('/reports/details', roomCtrl.getRoomReport); // Member B's Join Report

module.exports = router;
