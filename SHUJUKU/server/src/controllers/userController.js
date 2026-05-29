const bcrypt = require('bcrypt');
const { query } = require('../config/database');

const getUsers = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, keyword, role, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(pageSize);

        let sql = `SELECT id, student_no, name, email, role, avatar_url, phone, department, status, created_at 
                   FROM users WHERE deleted_at IS NULL`;
        let countSql = `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`;
        const params = [];
        const countParams = [];

        if (keyword) {
            sql += ` AND (name LIKE ? OR student_no LIKE ?)`;
            countSql += ` AND (name LIKE ? OR student_no LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
            countParams.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (role) {
            sql += ` AND role = ?`;
            countSql += ` AND role = ?`;
            params.push(role);
            countParams.push(role);
        }

        if (status) {
            sql += ` AND status = ?`;
            countSql += ` AND status = ?`;
            params.push(status);
            countParams.push(status);
        }

        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        const users = await query(sql, params);
        const totalResult = await query(countSql, countParams);

        res.json({
            success: true,
            data: {
                list: users,
                total: totalResult[0].total,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const users = await query(
            `SELECT id, student_no, name, email, role, avatar_url, phone, department, status, created_at 
             FROM users WHERE id = ? AND deleted_at IS NULL`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const clubs = await query(
            `SELECT m.club_id, m.role as club_role, m.points, m.join_date, c.name as club_name 
             FROM members m 
             JOIN clubs c ON m.club_id = c.id 
             WHERE m.user_id = ? AND m.status = 'active'`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...users[0],
                clubs
            }
        });
    } catch (error) {
        console.error('获取用户详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户详情失败'
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { student_no, name, email, password, role = 'user', phone, department } = req.body;

        if (!student_no || !name || !password) {
            return res.status(400).json({
                success: false,
                message: '学号、姓名和密码为必填项'
            });
        }

        const existing = await query(
            'SELECT id FROM users WHERE student_no = ? AND deleted_at IS NULL',
            [student_no]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该学号已存在'
            });
        }

        if (email) {
            const emailExisting = await query(
                'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
                [email]
            );
            if (emailExisting.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '该邮箱已被使用'
                });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await query(
            `INSERT INTO users (student_no, name, email, password_hash, role, phone, department, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [student_no, name, email, passwordHash, role, phone, department]
        );

        res.status(201).json({
            success: true,
            message: '用户创建成功',
            data: {
                id: result.insertId,
                student_no,
                name,
                email,
                role
            }
        });
    } catch (error) {
        console.error('创建用户错误:', error);
        res.status(500).json({
            success: false,
            message: '创建用户失败'
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, phone, department, avatar_url } = req.body;

        if (email) {
            const existing = await query(
                'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
                [email, id]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '该邮箱已被使用'
                });
            }
        }

        await query(
            `UPDATE users SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                role = COALESCE(?, role),
                phone = COALESCE(?, phone),
                department = COALESCE(?, department),
                avatar_url = COALESCE(?, avatar_url)
            WHERE id = ?`,
            [name, email, role, phone, department, avatar_url, id]
        );

        res.json({
            success: true,
            message: '用户信息更新成功'
        });
    } catch (error) {
        console.error('更新用户错误:', error);
        res.status(500).json({
            success: false,
            message: '更新用户失败'
        });
    }
};

const toggleUserBan = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: '不能封禁自己的账号'
            });
        }

        const users = await query('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        await query(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, id]
        );

        res.json({
            success: true,
            message: status === 'banned' ? '账号已封禁' : '账号已解封'
        });
    } catch (error) {
        console.error('封禁用户错误:', error);
        res.status(500).json({
            success: false,
            message: '操作失败'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: '不能删除自己的账号'
            });
        }

        await query(
            'UPDATE users SET deleted_at = NOW() WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: '用户已删除'
        });
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({
            success: false,
            message: '删除用户失败'
        });
    }
};

const batchImport = async (req, res) => {
    try {
        const { users } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供用户数据'
            });
        }

        const results = [];
        for (const user of users) {
            try {
                const { student_no, name, email, password = '123456', role = 'user', phone, department } = user;

                const existing = await query(
                    'SELECT id FROM users WHERE student_no = ? AND deleted_at IS NULL',
                    [student_no]
                );

                if (existing.length > 0) {
                    results.push({ student_no, success: false, message: '学号已存在' });
                    continue;
                }

                const passwordHash = await bcrypt.hash(password, 10);
                await query(
                    `INSERT INTO users (student_no, name, email, password_hash, role, phone, department, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
                    [student_no, name, email, passwordHash, role, phone, department]
                );

                results.push({ student_no, success: true });
            } catch (err) {
                results.push({ student_no: user.student_no, success: false, message: err.message });
            }
        }

        res.json({
            success: true,
            message: '批量导入完成',
            data: results
        });
    } catch (error) {
        console.error('批量导入错误:', error);
        res.status(500).json({
            success: false,
            message: '批量导入失败'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserBan,
    deleteUser,
    batchImport
};
