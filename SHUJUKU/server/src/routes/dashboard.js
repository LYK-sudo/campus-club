const { query } = require('../config/database');

const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const getDashboardStats = async (req, res) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;

        let stats = {};

        if (userRole === 'super_admin' || userRole === 'teacher') {
            const totalUsers = await query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');
            const totalClubs = await query('SELECT COUNT(*) as count FROM clubs WHERE status = "active"');
            const totalActivities = await query('SELECT COUNT(*) as count FROM activities WHERE status IN ("approved", "ongoing", "completed")');
            const pendingApprovals = await query('SELECT COUNT(*) as count FROM approvals WHERE status = "pending"');

            const usersByRole = await query(
                'SELECT role, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY role'
            );

            const clubsByCategory = await query(
                'SELECT category, COUNT(*) as count FROM clubs WHERE status = "active" GROUP BY category'
            );

            const activitiesByStatus = await query(
                'SELECT status, COUNT(*) as count FROM activities GROUP BY status'
            );

            const recentActivities = await query(
                `SELECT a.id, a.title, a.status, a.start_time, c.name as club_name 
                 FROM activities a 
                 JOIN clubs c ON a.club_id = c.id 
                 ORDER BY a.created_at DESC 
                 LIMIT 5`
            );

            stats = {
                totalUsers: totalUsers[0].count,
                totalClubs: totalClubs[0].count,
                totalActivities: totalActivities[0].count,
                pendingApprovals: pendingApprovals[0].count,
                usersByRole,
                clubsByCategory,
                activitiesByStatus,
                recentActivities
            };
        } else {
            const userClubs = req.user.clubs;
            const clubIds = userClubs.map(c => c.clubId);

            if (clubIds.length > 0) {
                const myActivities = await query(
                    `SELECT COUNT(*) as count FROM activities WHERE club_id IN (${clubIds.join(',')})`
                );

                const myPendingApprovals = await query(
                    `SELECT COUNT(*) as count FROM approvals WHERE club_id IN (${clubIds.join(',')}) AND status = 'pending'`
                );

                const totalPoints = await query(
                    `SELECT COALESCE(SUM(points), 0) as total FROM members WHERE user_id = ? AND status = 'active'`,
                    [userId]
                );

                const myRegistrations = await query(
                    `SELECT COUNT(*) as count FROM activity_registrations WHERE user_id = ? AND status IN ('registered', 'checked_in')`,
                    [userId]
                );

                stats = {
                    myClubs: userClubs.length,
                    myActivities: myActivities[0].count,
                    myPendingApprovals: myPendingApprovals[0].count,
                    totalPoints: totalPoints[0].total,
                    myRegistrations: myRegistrations[0].count
                };
            } else {
                const totalPoints = await query(
                    `SELECT COALESCE(SUM(points), 0) as total FROM members WHERE user_id = ? AND status = 'active'`,
                    [userId]
                );

                const myRegistrations = await query(
                    `SELECT COUNT(*) as count FROM activity_registrations WHERE user_id = ? AND status IN ('registered', 'checked_in')`,
                    [userId]
                );

                stats = {
                    myClubs: 0,
                    myActivities: 0,
                    myPendingApprovals: 0,
                    totalPoints: totalPoints[0].total,
                    myRegistrations: myRegistrations[0].count
                };
            }
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取仪表盘数据错误:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
};

router.get('/stats', authMiddleware, getDashboardStats);

module.exports = router;
