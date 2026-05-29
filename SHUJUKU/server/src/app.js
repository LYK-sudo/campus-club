const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clubRoutes = require('./routes/clubs');
const activityRoutes = require('./routes/activities');
const approvalRoutes = require('./routes/approvals');
const fundRoutes = require('./routes/funds');
const equipmentRoutes = require('./routes/equipment');
const creditRoutes = require('./routes/credits');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '校园智慧社团管理系统API运行正常',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         校园智慧社团管理系统后端服务已启动                      ║
╠════════════════════════════════════════════════════════════╣
║  端口: ${PORT}                                               ║
║  API地址: http://localhost:${PORT}/api                        ║
║  健康检查: http://localhost:${PORT}/api/health                ║
╚════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
