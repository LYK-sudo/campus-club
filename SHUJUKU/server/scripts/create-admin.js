const bcrypt = require('bcrypt');
const { query } = require('../src/config/database');

async function createAdmin() {
    try {
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        await query(
            `INSERT INTO users (student_no, name, email, password_hash, role, department, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'active')
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            ['admin', '系统管理员', 'admin@campus.edu', passwordHash, 'super_admin', '信息中心']
        );

        const teacherHash = await bcrypt.hash('teacher123', 10);
        await query(
            `INSERT INTO users (student_no, name, email, password_hash, role, department, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'active')
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            ['teacher001', '张老师', 'zhang@campus.edu', teacherHash, 'teacher', '校团委']
        );

        const userHash = await bcrypt.hash('123456', 10);
        await query(
            `INSERT INTO users (student_no, name, email, password_hash, role, department, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'active')
             ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
            ['2021001', '李明', 'liming@campus.edu', userHash, 'user', '计算机学院']
        );

        console.log('初始用户创建成功！');
        console.log('管理员: admin / admin123');
        console.log('老师: teacher001 / teacher123');
        console.log('学生: 2021001 / 123456');
    } catch (error) {
        console.error('创建用户失败:', error.message);
    }
}

createAdmin();
