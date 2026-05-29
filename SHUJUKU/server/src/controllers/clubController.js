const { query, transaction } = require('../config/database');

const getClubs = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, keyword, category, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT c.*, u.name as president_name 
                   FROM clubs c 
                   LEFT JOIN users u ON c.president_id = u.id 
                   WHERE 1=1`;
        let countSql = `SELECT COUNT(*) as total FROM clubs WHERE 1=1`;
        const params = [];
        const countParams = [];

        if (keyword) {
            sql += ` AND c.name LIKE ?`;
            countSql += ` AND name LIKE ?`;
            params.push(`%${keyword}%`);
            countParams.push(`%${keyword}%`);
        }

        if (category) {
            sql += ` AND c.category = ?`;
            countSql += ` AND category = ?`;
            params.push(category);
            countParams.push(category);
        }

        if (status) {
            sql += ` AND c.status = ?`;
            countSql += ` AND status = ?`;
            params.push(status);
            countParams.push(status);
        }

        sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const clubs = await query(sql, params);
        const totalResult = await query(countSql, countParams);

        for (const club of clubs) {
            const activityCount = await query(
                'SELECT COUNT(*) as count FROM activities WHERE club_id = ? AND status IN ("approved", "ongoing")',
                [club.id]
            );
            club.recent_activity_count = activityCount[0].count;
        }

        res.json({
            success: true,
            data: {
                list: clubs,
                total: totalResult[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取社团列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取社团列表失败'
        });
    }
};

const getClubById = async (req, res) => {
    try {
        const { id } = req.params;

        const clubs = await query(
            `SELECT c.*, u.name as president_name, u.phone as president_phone 
             FROM clubs c 
             LEFT JOIN users u ON c.president_id = u.id 
             WHERE c.id = ?`,
            [id]
        );

        if (clubs.length === 0) {
            return res.status(404).json({
                success: false,
                message: '社团不存在'
            });
        }

        const club = clubs[0];

        const members = await query(
            `SELECT m.id, m.user_id, m.role, m.points, m.join_date, m.intro, 
                    u.student_no, u.name, u.avatar_url, u.department
             FROM members m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.club_id = ? AND m.status = 'active'
             ORDER BY 
                CASE m.role 
                    WHEN 'president' THEN 1 
                    WHEN 'vice_president' THEN 2 
                    ELSE 3 
                END,
                m.join_date ASC`,
            [id]
        );

        const activities = await query(
            `SELECT id, title, type, start_time, end_time, status, current_participants, max_participants 
             FROM activities 
             WHERE club_id = ? 
             ORDER BY start_time DESC 
             LIMIT 5`,
            [id]
        );

        club.members = members;
        club.recent_activities = activities;

        res.json({
            success: true,
            data: club
        });
    } catch (error) {
        console.error('获取社团详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取社团详情失败'
        });
    }
};

const createClub = async (req, res) => {
    try {
        const { name, category, description, president_id, max_members = 100, budget = 0 } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: '社团名称不能为空'
            });
        }

        const existing = await query('SELECT id FROM clubs WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '社团名称已存在'
            });
        }

        const result = await transaction(async (conn) => {
            const [clubResult] = await conn.execute(
                `INSERT INTO clubs (name, category, description, president_id, max_members, budget, status, total_members) 
                 VALUES (?, ?, ?, ?, ?, ?, 'active', 1)`,
                [name, category || '其他', description, president_id, max_members, budget]
            );

            if (president_id) {
                await conn.execute(
                    `INSERT INTO members (club_id, user_id, role, join_date, status, points) 
                     VALUES (?, ?, 'president', CURDATE(), 'active', 0)`,
                    [clubResult.insertId, president_id]
                );
            }

            return clubResult;
        });

        res.status(201).json({
            success: true,
            message: '社团创建成功',
            data: {
                id: result.insertId,
                name
            }
        });
    } catch (error) {
        console.error('创建社团错误:', error);
        res.status(500).json({
            success: false,
            message: '创建社团失败'
        });
    }
};

const updateClub = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, logo_url, cover_url, max_members } = req.body;

        if (name) {
            const existing = await query(
                'SELECT id FROM clubs WHERE name = ? AND id != ?',
                [name, id]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '社团名称已存在'
                });
            }
        }

        await query(
            `UPDATE clubs SET 
                name = COALESCE(?, name),
                category = COALESCE(?, category),
                description = COALESCE(?, description),
                logo_url = COALESCE(?, logo_url),
                cover_url = COALESCE(?, cover_url),
                max_members = COALESCE(?, max_members)
            WHERE id = ?`,
            [name, category, description, logo_url, cover_url, max_members, id]
        );

        res.json({
            success: true,
            message: '社团信息更新成功'
        });
    } catch (error) {
        console.error('更新社团错误:', error);
        res.status(500).json({
            success: false,
            message: '更新社团失败'
        });
    }
};

const updateClubStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await query('UPDATE clubs SET status = ? WHERE id = ?', [status, id]);

        res.json({
            success: true,
            message: '社团状态更新成功'
        });
    } catch (error) {
        console.error('更新社团状态错误:', error);
        res.status(500).json({
            success: false,
            message: '更新状态失败'
        });
    }
};

const getClubMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, pageSize = 20, role } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT m.id, m.user_id, m.role, m.points, m.join_date, m.intro, 
                          u.student_no, u.name, u.avatar_url, u.department, u.phone
                   FROM members m 
                   JOIN users u ON m.user_id = u.id 
                   WHERE m.club_id = ? AND m.status = 'active'`;
        const params = [id];

        if (role) {
            sql += ` AND m.role = ?`;
            params.push(role);
        }

        sql += ` ORDER BY 
                    CASE m.role 
                        WHEN 'president' THEN 1 
                        WHEN 'vice_president' THEN 2 
                        ELSE 3 
                    END,
                    m.join_date ASC 
                LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const members = await query(sql, params);

        const countResult = await query(
            'SELECT COUNT(*) as total FROM members WHERE club_id = ? AND status = "active"',
            [id]
        );

        res.json({
            success: true,
            data: {
                list: members,
                total: countResult[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取社团成员错误:', error);
        res.status(500).json({
            success: false,
            message: '获取成员列表失败'
        });
    }
};

const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, role = 'member', intro } = req.body;

        const existing = await query(
            'SELECT id FROM members WHERE club_id = ? AND user_id = ? AND status = "active"',
            [id, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该用户已是社团成员'
            });
        }

        const club = await query('SELECT total_members, max_members FROM clubs WHERE id = ?', [id]);
        if (club[0].total_members >= club[0].max_members) {
            return res.status(400).json({
                success: false,
                message: '社团成员已达上限'
            });
        }

        await transaction(async (conn) => {
            await conn.execute(
                `INSERT INTO members (club_id, user_id, role, join_date, status, intro, points) 
                 VALUES (?, ?, ?, CURDATE(), 'active', ?, 0)`,
                [id, user_id, role, intro]
            );

            await conn.execute(
                'UPDATE clubs SET total_members = total_members + 1 WHERE id = ?',
                [id]
            );
        });

        res.status(201).json({
            success: true,
            message: '成员添加成功'
        });
    } catch (error) {
        console.error('添加成员错误:', error);
        res.status(500).json({
            success: false,
            message: '添加成员失败'
        });
    }
};

const updateMemberRole = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role } = req.body;

        if (role === 'president') {
            const currentPresident = await query(
                'SELECT user_id FROM members WHERE club_id = ? AND role = "president" AND status = "active"',
                [id]
            );

            if (currentPresident.length > 0) {
                await query(
                    'UPDATE members SET role = "member" WHERE club_id = ? AND user_id = ?',
                    [id, currentPresident[0].user_id]
                );
            }

            await query(
                'UPDATE clubs SET president_id = ? WHERE id = ?',
                [userId, id]
            );
        }

        await query(
            'UPDATE members SET role = ? WHERE club_id = ? AND user_id = ?',
            [role, id, userId]
        );

        res.json({
            success: true,
            message: '成员角色更新成功'
        });
    } catch (error) {
        console.error('更新成员角色错误:', error);
        res.status(500).json({
            success: false,
            message: '更新角色失败'
        });
    }
};

const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const member = await query(
            'SELECT role FROM members WHERE club_id = ? AND user_id = ? AND status = "active"',
            [id, userId]
        );

        if (member.length === 0) {
            return res.status(404).json({
                success: false,
                message: '成员不存在'
            });
        }

        if (member[0].role === 'president') {
            return res.status(400).json({
                success: false,
                message: '不能移除社团负责人，请先转让负责人'
            });
        }

        await transaction(async (conn) => {
            await conn.execute(
                `UPDATE members SET status = 'inactive', leave_date = CURDATE() 
                 WHERE club_id = ? AND user_id = ?`,
                [id, userId]
            );

            await conn.execute(
                'UPDATE clubs SET total_members = GREATEST(total_members - 1, 0) WHERE id = ?',
                [id]
            );
        });

        res.json({
            success: true,
            message: '成员已移除'
        });
    } catch (error) {
        console.error('移除成员错误:', error);
        res.status(500).json({
            success: false,
            message: '移除成员失败'
        });
    }
};

const getClubStats = async (req, res) => {
    try {
        const { id } = req.params;

        const memberStats = await query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN role = 'member' THEN 1 END) as members,
                COUNT(CASE WHEN role = 'vice_president' THEN 1 END) as vice_presidents
             FROM members WHERE club_id = ? AND status = 'active'`,
            [id]
        );

        const activityStats = await query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
             FROM activities WHERE club_id = ?`,
            [id]
        );

        const fundStats = await query(
            `SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
             FROM fund_records WHERE club_id = ?`,
            [id]
        );

        const memberGrowth = await query(
            `SELECT DATE_FORMAT(join_date, '%Y-%m') as month, COUNT(*) as count
             FROM members 
             WHERE club_id = ? AND status = 'active' 
             GROUP BY DATE_FORMAT(join_date, '%Y-%m') 
             ORDER BY month DESC 
             LIMIT 12`,
            [id]
        );

        res.json({
            success: true,
            data: {
                members: memberStats[0],
                activities: activityStats[0],
                funds: fundStats[0],
                memberGrowth: memberGrowth.reverse()
            }
        });
    } catch (error) {
        console.error('获取社团统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取统计数据失败'
        });
    }
};

module.exports = {
    getClubs,
    getClubById,
    createClub,
    updateClub,
    updateClubStatus,
    getClubMembers,
    addMember,
    updateMemberRole,
    removeMember,
    getClubStats
};
