const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/', authMiddleware, roleMiddleware('super_admin'), userController.getUsers);
router.get('/:id', authMiddleware, roleMiddleware('super_admin'), userController.getUserById);
router.post('/', authMiddleware, roleMiddleware('super_admin'), userController.createUser);
router.post('/batch', authMiddleware, roleMiddleware('super_admin'), userController.batchImport);
router.put('/:id', authMiddleware, roleMiddleware('super_admin'), userController.updateUser);
router.put('/:id/ban', authMiddleware, roleMiddleware('super_admin'), userController.toggleUserBan);
router.delete('/:id', authMiddleware, roleMiddleware('super_admin'), userController.deleteUser);

module.exports = router;
