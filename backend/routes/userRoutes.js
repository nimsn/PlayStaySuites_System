const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

router.get('/', userController.getUsers);

router.get('/roles', userController.getRoles);

router.get('/reports/inactive', userController.getInactiveReport);

router.post('/', userController.addUser);

router.put('/:id', userController.editUser);

router.delete('/:id', userController.removeUser);

module.exports = router;