const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const clubController = require('../controllers/clubController');

router.get('/', authMiddleware, clubController.getClubs);
router.get('/:id', authMiddleware, clubController.getClubById);
router.post('/', authMiddleware, roleMiddleware('super_admin'), clubController.createClub);
router.put('/:id', authMiddleware, clubController.updateClub);
router.put('/:id/status', authMiddleware, roleMiddleware('super_admin'), clubController.updateClubStatus);

router.get('/:id/members', authMiddleware, clubController.getClubMembers);
router.post('/:id/members', authMiddleware, clubController.addMember);
router.put('/:id/members/:userId', authMiddleware, clubController.updateMemberRole);
router.delete('/:id/members/:userId', authMiddleware, clubController.removeMember);

router.get('/:id/stats', authMiddleware, clubController.getClubStats);

module.exports = router;
