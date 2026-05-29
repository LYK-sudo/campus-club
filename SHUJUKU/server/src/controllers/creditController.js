const { query } = require('../config/database');

const getCreditLogs = async (req, res) => {
    try {
        const { page = 1, pageSize = 20, user_id, club_id, activity_id } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT cl.*, u.name as user_name, c.name as club_name, a.title as activity_title
                   FROM credit_logs cl 
                   JOIN users u ON cl.user_id = u.id 
                   LEFT JOIN clubs c ON cl.club_id = c.id 
                   LEFT JOIN activities a ON cl.activity_id = a.id 
                   WHERE 1=1`;
        const params = [];

        if (user_id) {
            sql += ` AND cl.user_id = ?`;
            params.push(user_id);
        } else if (req.user.role !== 'super_admin' && req.user.role !== 'teacher') {
            sql += ` AND cl.user_id = ?`;
            params.push(req.user.id);
        }

        if (club_id) {
            sql += ` AND cl.club_id = ?`;
            params.push(club_id);
        }

        if (activity_id) {
            sql += ` AND cl.activity_id = ?`;
            params.push(activity_id);
        }

        sql += ` ORDER BY cl.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const logs = await query(sql, params);

        res.json({
            success: true,
            data: {
                list: logs,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取积分记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取积分记录失败'
        });
    }
};

const getUserCreditSummary = async (req, res) => {
    try {
        const userId = req.params.user_id || req.user.id;

        const summary = await query(
            `SELECT 
                COALESCE(SUM(points_change), 0) as total_points,
                COALESCE(SUM(credit_change), 0) as total_credits,
                COUNT(*) as total_records
             FROM credit_logs WHERE user_id = ?`,
            [userId]
        );

        const byClub = await query(
            `SELECT c.id, c.name, SUM(cl.points_change) as points
             FROM credit_logs cl 
             JOIN clubs c ON cl.club_id = c.id 
             WHERE cl.user_id = ? 
             GROUP BY c.id, c.name`,
            [userId]
        );

        const byActivity = await query(
            `SELECT a.id, a.title, a.type, cl.points_change, cl.created_at
             FROM credit_logs cl 
             JOIN activities a ON cl.activity_id = a.id 
             WHERE cl.user_id = ? 
             ORDER BY cl.created_at DESC 
             LIMIT 10`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                summary: summary[0],
                byClub,
                recentActivities: byActivity
            }
        });
    } catch (error) {
        console.error('获取积分统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取积分统计失败'
        });
    }
};

const addCreditManually = async (req, res) => {
    try {
        const { user_id, club_id, points_change, credit_change, reason } = req.body;

        await query(
            `INSERT INTO credit_logs (user_id, club_id, points_change, credit_change, reason, operator_id, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [user_id, club_id, points_change, credit_change || 0, reason, req.user.id]
        );

        if (club_id && points_change) {
            await query(
                `UPDATE members SET points = points + ? WHERE user_id = ? AND club_id = ? AND status = 'active'`,
                [points_change, user_id, club_id]
            );
        }

        res.json({
            success: true,
            message: '积分添加成功'
        });
    } catch (error) {
        console.error('手动添加积分错误:', error);
        res.status(500).json({
            success: false,
            message: '添加积分失败'
        });
    }
};

module.exports = {
    getCreditLogs,
    getUserCreditSummary,
    addCreditManually
};
