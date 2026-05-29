const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const fundController = require('../controllers/fundController');

router.get('/', authMiddleware, fundController.getFundRecords);
router.post('/', authMiddleware, fundController.createFundRecord);
router.get('/summary', authMiddleware, fundController.getFundSummary);

module.exports = router;
