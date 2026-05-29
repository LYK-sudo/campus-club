const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const equipmentController = require('../controllers/equipmentController');

router.get('/', authMiddleware, equipmentController.getEquipment);
router.post('/', authMiddleware, equipmentController.createEquipment);
router.put('/:id', authMiddleware, equipmentController.updateEquipment);

router.get('/borrows', authMiddleware, equipmentController.getBorrowRecords);
router.post('/borrow', authMiddleware, equipmentController.borrowEquipment);
router.post('/return/:id', authMiddleware, equipmentController.returnEquipment);

module.exports = router;
