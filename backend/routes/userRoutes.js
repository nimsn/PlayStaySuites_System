const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

router.get('/', userCtrl.getUsers);
router.post('/', userCtrl.addUser);
router.delete('/:id', userCtrl.removeUser);
router.get('/reports/inactive', userCtrl.getInactiveReport); // Member A's Join Report

module.exports = router;