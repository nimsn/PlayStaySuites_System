const router = require('express').Router();
const ctrl = require('../controllers/amenityController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
router.use(authenticateToken, authorizeRoles('Admin', 'Staff'));
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
module.exports = router;
