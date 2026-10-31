const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');


router.get('/', roomController.getRooms);


router.get('/types', roomController.getRoomTypes);


router.get('/reports/details', roomController.getRoomReport);


router.post('/', roomController.addRoom);


router.put('/:id', roomController.editRoom);


router.patch('/:id/status', roomController.changeStatus);


router.delete('/:id', roomController.removeRoom);

module.exports = router;