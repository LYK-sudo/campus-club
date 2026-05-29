const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const login = async (req, res) => {
    try {
        const { student_no, password } = req.body;

        if (!student_no || !password) {
            return res.status(400).json({
                success: false,
                message: '学号和密码不能为空'
            });
        }

        const users = await query(
            'SELECT * FROM users WHERE student_no = ? AND deleted_at IS NULL',
            [student_no]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '学号或密码错误'
            });
        }

        const user = users[0];

        if (user.status === 'banned') {
            return res.status(403).json({
                success: false,
                message: '账号已被封禁，请联系管理员'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '学号或密码错误'
            });
        }

        const members = await query(
            `SELECT m.club_id, m.role as club_role, c.name as club_name 
             FROM members m 
             JOIN clubs c ON m.club_id = c.id 
             WHERE m.user_id = ? AND m.status = 'active'`,
            [user.id]
        );

        const totalPoints = await query(
            'SELECT COALESCE(SUM(points), 0) as total FROM members WHERE user_id = ? AND status = "active"',
            [user.id]
        );

        const token = generateToken({ 
            userId: user.id,
            studentNo: user.student_no,
            role: user.role
        });

        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    student_no: user.student_no,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                    phone: user.phone,
                    department: user.department,
                    clubs: members.map(m => ({
                        clubId: m.club_id,
                        clubName: m.club_name,
                        role: m.club_role
                    })),
                    totalPoints: totalPoints[0].total
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const totalPoints = await query(
            'SELECT COALESCE(SUM(points), 0) as total FROM members WHERE user_id = ? AND status = "active"',
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                ...req.user,
                totalPoints: totalPoints[0].total
            }
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, department, avatar_url } = req.body;
        const userId = req.user.id;

        if (email) {
            const existing = await query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被使用'
                });
            }
        }

        await query(
            `UPDATE users SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                department = COALESCE(?, department),
                avatar_url = COALESCE(?, avatar_url)
            WHERE id = ?`,
            [name, email, phone, department, avatar_url, userId]
        );

        const users = await query(
            'SELECT id, student_no, name, email, role, avatar_url, phone, department FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: '个人信息更新成功',
            data: users[0]
        });
    } catch (error) {
        console.error('更新个人信息错误:', error);
        res.status(500).json({
            success: false,
            message: '更新失败'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const userId = req.user.id;

        if (!old_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: '旧密码和新密码不能为空'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度不能少于6位'
            });
        }

        const users = await query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        const isMatch = await bcrypt.compare(old_password, users[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: '旧密码错误'
            });
        }

        const newPasswordHash = await bcrypt.hash(new_password, 10);
        await query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败'
        });
    }
};

const logout = async (req, res) => {
    res.json({
        success: true,
        message: '登出成功'
    });
};

module.exports = {
    login,
    getCurrentUser,
    updateProfile,
    changePassword,
    logout
};
