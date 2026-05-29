const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const creditController = require('../controllers/creditController');

router.get('/', authMiddleware, creditController.getCreditLogs);
router.get('/summary/:user_id?', authMiddleware, creditController.getUserCreditSummary);
router.post('/add', authMiddleware, creditController.addCreditManually);

module.exports = router;
