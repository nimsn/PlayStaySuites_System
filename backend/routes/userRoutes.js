const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/login', userController.loginUser);
router.post('/register', userController.registerUser);

router.get('/', authenticateToken, authorizeRoles('Admin'), userController.getUsers);
router.get('/roles', authenticateToken, authorizeRoles('Admin'), userController.getRoles);
router.get('/customers', authenticateToken, authorizeRoles('Admin', 'Staff'), userController.getCustomers);
router.get('/reports/inactive', authenticateToken, authorizeRoles('Admin'), userController.getInactiveReport);

router.post('/', authenticateToken, authorizeRoles('Admin'), userController.addUser);
router.put('/:id', authenticateToken, authorizeRoles('Admin'), userController.editUser);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), userController.removeUser);

module.exports = router;