const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_club_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: '未提供认证令牌' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ 
                success: false, 
                message: '令牌无效或已过期' 
            });
        }

        const users = await query(
            'SELECT id, student_no, name, email, role, avatar_url, phone, department, status FROM users WHERE id = ? AND deleted_at IS NULL',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: '用户不存在' 
            });
        }

        if (users[0].status === 'banned') {
            return res.status(403).json({ 
                success: false, 
                message: '账号已被封禁' 
            });
        }

        const members = await query(
            `SELECT m.club_id, m.role as club_role, c.name as club_name 
             FROM members m 
             JOIN clubs c ON m.club_id = c.id 
             WHERE m.user_id = ? AND m.status = 'active'`,
            [users[0].id]
        );

        req.user = {
            ...users[0],
            clubs: members.map(m => ({
                clubId: m.club_id,
                clubName: m.club_name,
                role: m.club_role
            }))
        };

        next();
    } catch (error) {
        console.error('认证中间件错误:', error);
        return res.status(500).json({ 
            success: false, 
            message: '认证失败' 
        });
    }
};

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: '未认证' 
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: '权限不足' 
            });
        }

        next();
    };
};

const clubRoleMiddleware = (clubIdParam = 'clubId') => {
    return (req, res, next) => {
        const clubId = parseInt(req.params[clubIdParam] || req.body.club_id);
        
        if (req.user.role === 'super_admin' || req.user.role === 'teacher') {
            return next();
        }

        const clubMember = req.user.clubs.find(c => c.clubId === clubId);
        
        if (!clubMember) {
            return res.status(403).json({ 
                success: false, 
                message: '您不是该社团成员' 
            });
        }

        req.user.clubRole = clubMember.role;
        next();
    };
};

const isClubPresident = (clubId) => {
    if (req.user.role === 'super_admin') return true;
    const club = req.user.clubs.find(c => c.clubId === clubId);
    return club && club.role === 'president';
};

module.exports = {
    generateToken,
    verifyToken,
    authMiddleware,
    roleMiddleware,
    clubRoleMiddleware,
    isClubPresident
};
