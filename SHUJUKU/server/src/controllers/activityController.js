const { query, transaction } = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const getActivities = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, club_id, type, status, keyword, start_date, end_date } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT a.*, c.name as club_name, u.name as creator_name 
                   FROM activities a 
                   JOIN clubs c ON a.club_id = c.id 
                   JOIN users u ON a.creator_id = u.id 
                   WHERE 1=1`;
        let countSql = `SELECT COUNT(*) as total FROM activities WHERE 1=1`;
        const params = [];
        const countParams = [];

        if (club_id) {
            sql += ` AND a.club_id = ?`;
            countSql += ` AND club_id = ?`;
            params.push(club_id);
            countParams.push(club_id);
        }

        if (type) {
            sql += ` AND a.type = ?`;
            countSql += ` AND type = ?`;
            params.push(type);
            countParams.push(type);
        }

        if (status) {
            sql += ` AND a.status = ?`;
            countSql += ` AND status = ?`;
            params.push(status);
            countParams.push(status);
        } else {
            sql += ` AND a.status != 'draft'`;
            countSql += ` AND status != 'draft'`;
        }

        if (keyword) {
            sql += ` AND a.title LIKE ?`;
            countSql += ` AND title LIKE ?`;
            params.push(`%${keyword}%`);
            countParams.push(`%${keyword}%`);
        }

        if (start_date) {
            sql += ` AND a.start_time >= ?`;
            countSql += ` AND start_time >= ?`;
            params.push(start_date);
            countParams.push(start_date);
        }

        if (end_date) {
            sql += ` AND a.end_time <= ?`;
            countSql += ` AND end_time <= ?`;
            params.push(end_date);
            countParams.push(end_date);
        }

        sql += ` ORDER BY a.start_time DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const activities = await query(sql, params);
        const totalResult = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                list: activities,
                total: totalResult[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取活动列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取活动列表失败'
        });
    }
};

const getActivityById = async (req, res) => {
    try {
        const { id } = req.params;

        const activities = await query(
            `SELECT a.*, c.name as club_name, u.name as creator_name 
             FROM activities a 
             JOIN clubs c ON a.club_id = c.id 
             JOIN users u ON a.creator_id = u.id 
             WHERE a.id = ?`,
            [id]
        );

        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        const activity = activities[0];

        const registrations = await query(
            `SELECT ar.id, ar.user_id, ar.register_time, ar.checkin_time, ar.status,
                    u.student_no, u.name, u.avatar_url, u.department
             FROM activity_registrations ar
             JOIN users u ON ar.user_id = u.id
             WHERE ar.activity_id = ?
             ORDER BY ar.register_time ASC`,
            [id]
        );

        activity.registrations = registrations;

        const userRegistration = await query(
            'SELECT * FROM activity_registrations WHERE activity_id = ? AND user_id = ?',
            [id, req.user.id]
        );
        activity.user_registered = userRegistration.length > 0;
        activity.user_registration = userRegistration[0] || null;

        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('获取活动详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取活动详情失败'
        });
    }
};

const createActivity = async (req, res) => {
    try {
        const { 
            club_id, title, type, description, location, 
            start_time, end_time, registration_deadline, 
            max_participants, credit_points, cover_url, is_public 
        } = req.body;

        if (!club_id || !title || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: '社团、标题、开始时间和结束时间为必填项'
            });
        }

        const result = await query(
            `INSERT INTO activities 
             (club_id, creator_id, title, type, description, location, 
              start_time, end_time, registration_deadline, max_participants, 
              credit_points, cover_url, is_public, status, current_participants) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0)`,
            [club_id, req.user.id, title, type || 'other', description, location,
             start_time, end_time, registration_deadline, max_participants,
             credit_points || 0, cover_url, is_public !== false]
        );

        res.status(201).json({
            success: true,
            message: '活动创建成功',
            data: {
                id: result.insertId,
                title
            }
        });
    } catch (error) {
        console.error('创建活动错误:', error);
        res.status(500).json({
            success: false,
            message: '创建活动失败'
        });
    }
};

const updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, type, description, location, 
            start_time, end_time, registration_deadline, 
            max_participants, credit_points, cover_url, is_public 
        } = req.body;

        const activities = await query('SELECT status FROM activities WHERE id = ?', [id]);
        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        if (activities[0].status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: '只有草稿状态的活动可以修改'
            });
        }

        await query(
            `UPDATE activities SET 
                title = COALESCE(?, title),
                type = COALESCE(?, type),
                description = COALESCE(?, description),
                location = COALESCE(?, location),
                start_time = COALESCE(?, start_time),
                end_time = COALESCE(?, end_time),
                registration_deadline = COALESCE(?, registration_deadline),
                max_participants = COALESCE(?, max_participants),
                credit_points = COALESCE(?, credit_points),
                cover_url = COALESCE(?, cover_url),
                is_public = COALESCE(?, is_public)
            WHERE id = ?`,
            [title, type, description, location, start_time, end_time, 
             registration_deadline, max_participants, credit_points, cover_url, is_public, id]
        );

        res.json({
            success: true,
            message: '活动更新成功'
        });
    } catch (error) {
        console.error('更新活动错误:', error);
        res.status(500).json({
            success: false,
            message: '更新活动失败'
        });
    }
};

const deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activities = await query('SELECT status FROM activities WHERE id = ?', [id]);
        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        if (activities[0].status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: '只有草稿状态的活动可以删除'
            });
        }

        await query('DELETE FROM activities WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '活动已删除'
        });
    } catch (error) {
        console.error('删除活动错误:', error);
        res.status(500).json({
            success: false,
            message: '删除活动失败'
        });
    }
};

const submitActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activities = await query(
            'SELECT a.*, c.name as club_name FROM activities a JOIN clubs c ON a.club_id = c.id WHERE a.id = ?',
            [id]
        );

        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        const activity = activities[0];

        if (activity.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: '只有草稿状态的活动可以提交审批'
            });
        }

        await transaction(async (conn) => {
            await conn.execute(
                'UPDATE activities SET status = "pending" WHERE id = ?',
                [id]
            );

            await conn.execute(
                `INSERT INTO approvals (type, ref_id, club_id, applicant_id, status, apply_reason, applied_at) 
                 VALUES ('activity', ?, ?, ?, 'pending', ?, NOW())`,
                [id, activity.club_id, req.user.id, `申请举办活动：${activity.title}`]
            );
        });

        res.json({
            success: true,
            message: '活动已提交审批'
        });
    } catch (error) {
        console.error('提交活动审批错误:', error);
        res.status(500).json({
            success: false,
            message: '提交审批失败'
        });
    }
};

const cancelActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const activities = await query('SELECT status FROM activities WHERE id = ?', [id]);
        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        if (!['approved', 'pending'].includes(activities[0].status)) {
            return res.status(400).json({
                success: false,
                message: '当前状态的活动不能取消'
            });
        }

        await query(
            'UPDATE activities SET status = "cancelled" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: '活动已取消'
        });
    } catch (error) {
        console.error('取消活动错误:', error);
        res.status(500).json({
            success: false,
            message: '取消活动失败'
        });
    }
};

const registerActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activities = await query(
            'SELECT * FROM activities WHERE id = ? AND status = "approved"',
            [id]
        );

        if (activities.length === 0) {
            return res.status(404).json({
                success: false,
                message: '活动不存在或未开放报名'
            });
        }

        const activity = activities[0];

        if (activity.registration_deadline && new Date(activity.registration_deadline) < new Date()) {
            return res.status(400).json({
                success: false,
                message: '报名已截止'
            });
        }

        if (activity.max_participants && activity.current_participants >= activity.max_participants) {
            return res.status(400).json({
                success: false,
                message: '报名人数已满'
            });
        }

        const existing = await query(
            'SELECT id FROM activity_registrations WHERE activity_id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '您已报名该活动'
            });
        }

        await transaction(async (conn) => {
            await conn.execute(
                `INSERT INTO activity_registrations (activity_id, user_id, status) 
                 VALUES (?, ?, 'registered')`,
                [id, req.user.id]
            );

            await conn.execute(
                'UPDATE activities SET current_participants = current_participants + 1 WHERE id = ?',
                [id]
            );
        });

        res.json({
            success: true,
            message: '报名成功'
        });
    } catch (error) {
        console.error('活动报名错误:', error);
        res.status(500).json({
            success: false,
            message: '报名失败'
        });
    }
};

const cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        const registration = await query(
            `SELECT ar.*, a.start_time 
             FROM activity_registrations ar 
             JOIN activities a ON ar.activity_id = a.id 
             WHERE ar.activity_id = ? AND ar.user_id = ?`,
            [id, req.user.id]
        );

        if (registration.length === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到报名记录'
            });
        }

        if (new Date(registration[0].start_time) < new Date()) {
            return res.status(400).json({
                success: false,
                message: '活动已开始，不能取消报名'
            });
        }

        await transaction(async (conn) => {
            await conn.execute(
                'UPDATE activity_registrations SET status = "cancelled" WHERE activity_id = ? AND user_id = ?',
                [id, req.user.id]
            );

            await conn.execute(
                'UPDATE activities SET current_participants = GREATEST(current_participants - 1, 0) WHERE id = ?',
                [id]
            );
        });

        res.json({
            success: true,
            message: '已取消报名'
        });
    } catch (error) {
        console.error('取消报名错误:', error);
        res.status(500).json({
            success: false,
            message: '取消报名失败'
        });
    }
};

const getRegistrations = async (req, res) => {
    try {
        const { id } = req.params;

        const registrations = await query(
            `SELECT ar.*, u.student_no, u.name, u.avatar_url, u.department, u.phone
             FROM activity_registrations ar
             JOIN users u ON ar.user_id = u.id
             WHERE ar.activity_id = ?
             ORDER BY ar.register_time ASC`,
            [id]
        );

        res.json({
            success: true,
            data: registrations
        });
    } catch (error) {
        console.error('获取报名列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取报名列表失败'
        });
    }
};

const generateCheckinQRCode = async (req, res) => {
    try {
        const { id } = req.params;

        const activities = await query(
            'SELECT * FROM activities WHERE id = ? AND status = "ongoing"',
            [id]
        );

        if (activities.length === 0) {
            return res.status(400).json({
                success: false,
                message: '活动不存在或未在进行中'
            });
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await query(
            'UPDATE activities SET checkin_token = ?, checkin_token_expires = ? WHERE id = ?',
            [token, expiresAt, id]
        );

        const checkinUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkin/${id}/${token}`;
        const qrCodeDataUrl = await QRCode.toDataURL(checkinUrl);

        res.json({
            success: true,
            data: {
                token,
                expiresAt,
                qrCode: qrCodeDataUrl,
                checkinUrl
            }
        });
    } catch (error) {
        console.error('生成签到二维码错误:', error);
        res.status(500).json({
            success: false,
            message: '生成二维码失败'
        });
    }
};

const checkin = async (req, res) => {
    try {
        const { id } = req.params;
        const { token } = req.body;

        const activities = await query(
            'SELECT * FROM activities WHERE id = ? AND status = "ongoing" AND checkin_token = ? AND checkin_token_expires > NOW()',
            [id, token]
        );

        if (activities.length === 0) {
            return res.status(400).json({
                success: false,
                message: '签到码无效或已过期'
            });
        }

        const registration = await query(
            'SELECT * FROM activity_registrations WHERE activity_id = ? AND user_id = ? AND status = "registered"',
            [id, req.user.id]
        );

        if (registration.length === 0) {
            return res.status(400).json({
                success: false,
                message: '您未报名该活动或已签到'
            });
        }

        await query(
            'UPDATE activity_registrations SET status = "checked_in", checkin_time = NOW() WHERE activity_id = ? AND user_id = ?',
            [id, req.user.id]
        );

        res.json({
            success: true,
            message: '签到成功'
        });
    } catch (error) {
        console.error('签到错误:', error);
        res.status(500).json({
            success: false,
            message: '签到失败'
        });
    }
};

const getCheckinRecords = async (req, res) => {
    try {
        const { id } = req.params;

        const records = await query(
            `SELECT ar.*, u.student_no, u.name, u.avatar_url 
             FROM activity_registrations ar
             JOIN users u ON ar.user_id = u.id
             WHERE ar.activity_id = ? AND ar.status = "checked_in"
             ORDER BY ar.checkin_time ASC`,
            [id]
        );

        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        console.error('获取签到记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取签到记录失败'
        });
    }
};

const completeActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activities = await query(
            'SELECT * FROM activities WHERE id = ? AND status = "ongoing"',
            [id]
        );

        if (activities.length === 0) {
            return res.status(400).json({
                success: false,
                message: '活动不存在或未在进行中'
            });
        }

        const activity = activities[0];

        const checkedIn = await query(
            `SELECT user_id FROM activity_registrations 
             WHERE activity_id = ? AND status = "checked_in"`,
            [id]
        );

        await transaction(async (conn) => {
            await conn.execute(
                'UPDATE activities SET status = "completed" WHERE id = ?',
                [id]
            );

            for (const reg of checkedIn) {
                await conn.execute(
                    `INSERT INTO credit_logs (user_id, club_id, activity_id, points_change, reason, operator_id, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [reg.user_id, activity.club_id, id, activity.credit_points, 
                     `参与活动：${activity.title}`, req.user.id]
                );

                await conn.execute(
                    `UPDATE members SET points = points + ? WHERE user_id = ? AND club_id = ? AND status = 'active'`,
                    [activity.credit_points, reg.user_id, activity.club_id]
                );
            }
        });

        res.json({
            success: true,
            message: `活动已结束，已为 ${checkedIn.length} 名参与者发放积分`
        });
    } catch (error) {
        console.error('结束活动错误:', error);
        res.status(500).json({
            success: false,
            message: '结束活动失败'
        });
    }
};

module.exports = {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity,
    submitActivity,
    cancelActivity,
    registerActivity,
    cancelRegistration,
    getRegistrations,
    generateCheckinQRCode,
    checkin,
    getCheckinRecords,
    completeActivity
};
