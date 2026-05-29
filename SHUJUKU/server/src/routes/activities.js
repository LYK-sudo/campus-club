const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

router.get('/', authMiddleware, activityController.getActivities);
router.get('/:id', authMiddleware, activityController.getActivityById);
router.post('/', authMiddleware, activityController.createActivity);
router.put('/:id', authMiddleware, activityController.updateActivity);
router.delete('/:id', authMiddleware, activityController.deleteActivity);
router.post('/:id/submit', authMiddleware, activityController.submitActivity);
router.post('/:id/cancel', authMiddleware, activityController.cancelActivity);

router.post('/:id/register', authMiddleware, activityController.registerActivity);
router.delete('/:id/register', authMiddleware, activityController.cancelRegistration);
router.get('/:id/registrations', authMiddleware, activityController.getRegistrations);

router.get('/:id/checkin/qrcode', authMiddleware, activityController.generateCheckinQRCode);
router.post('/:id/checkin', authMiddleware, activityController.checkin);
router.get('/:id/checkin/records', authMiddleware, activityController.getCheckinRecords);

router.post('/:id/complete', authMiddleware, activityController.completeActivity);

module.exports = router;
