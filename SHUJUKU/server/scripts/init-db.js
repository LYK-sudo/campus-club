const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('开始初始化数据库...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    console.log('数据库连接成功');

    const sqlFile = path.join(__dirname, '..', '..', 'database', 'init.sql');
    
    if (!fs.existsSync(sqlFile)) {
        console.error('SQL文件不存在:', sqlFile);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('执行SQL脚本...');
    await connection.query(sql);

    console.log('\n数据库初始化完成！');
    console.log('默认管理员账号: admin / admin123');
    console.log('校团委老师账号: teacher001 / teacher123');
    console.log('测试学生账号: 2021001 / 123456');

    await connection.end();
}

initDatabase().catch(err => {
    console.error('初始化失败:', err.message);
    process.exit(1);
});
