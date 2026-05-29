const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const approvalController = require('../controllers/approvalController');

router.get('/', authMiddleware, approvalController.getApprovals);
router.get('/:id', authMiddleware, approvalController.getApprovalById);
router.post('/:id/approve', authMiddleware, roleMiddleware('super_admin', 'teacher'), approvalController.approveRequest);
router.post('/:id/reject', authMiddleware, roleMiddleware('super_admin', 'teacher'), approvalController.rejectRequest);

module.exports = router;
