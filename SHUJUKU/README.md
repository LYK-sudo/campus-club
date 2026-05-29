# 校园智慧社团综合管理系统

## 📖 项目简介

本系统为校园智慧社团综合管理平台，采用前后端分离架构，支持社团管理、活动管理、审批流程、经费管理、物资管理、积分系统等完整功能。

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | Vue 3 + Element Plus + Pinia + Vue Router + Axios + ECharts |
| 后端 | Node.js + Express + JWT + bcrypt + MySQL2 |
| 数据库 | MySQL 8.0 |
| 开发工具 | Vite |

## 📁 项目结构

```
SHUJUKU/
├── database/          # 数据库脚本
│   └── init.sql       # 建表SQL
├── server/            # 后端项目
│   ├── src/
│   │   ├── config/    # 配置文件
│   │   ├── controllers/ # 控制器
│   │   ├── middleware/ # 中间件
│   │   ├── routes/    # 路由
│   │   └── app.js     # 入口文件
│   ├── scripts/       # 脚本
│   ├── .env           # 环境配置
│   └── package.json
├── client/            # 前端项目
│   ├── src/
│   │   ├── api/       # API接口
│   │   ├── layout/    # 布局组件
│   │   ├── router/    # 路由配置
│   │   ├── stores/    # 状态管理
│   │   ├── utils/     # 工具函数
│   │   └── views/     # 页面组件
│   └── package.json
├── start.bat          # 一键启动脚本
├── init-database.bat  # 数据库初始化脚本
└── README.md
```

## 🚀 快速开始

### 前置要求

1. **Node.js 18+** - [下载地址](https://nodejs.org/)
2. **MySQL 8.0** - [下载地址](https://dev.mysql.com/downloads/mysql/)

### 安装步骤

#### 方式一：一键安装（推荐）

1. **初始化数据库**
   - 双击运行 `init-database.bat`
   - 按提示输入数据库连接信息
   - 等待数据库初始化完成

2. **启动系统**
   - 双击运行 `start.bat`
   - 等待依赖安装和服务启动
   - 浏览器自动打开 http://localhost:5173

#### 方式二：手动安装

1. **配置数据库**
   ```bash
   # 创建数据库
   mysql -u root -p < database/init.sql
   ```

2. **配置后端**
   ```bash
   cd server
   
   # 修改 .env 文件
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=campus_club
   
   # 安装依赖
   npm install
   
   # 初始化数据库
   npm run init-db
   
   # 启动后端
   npm run dev
   ```

3. **配置前端**
   ```bash
   cd client
   
   # 安装依赖
   npm install
   
   # 启动前端
   npm run dev
   ```

4. **访问系统**
   - 前端：http://localhost:5173
   - 后端API：http://localhost:3000/api

## 👤 默认账号

| 角色 | 学号 | 密码 | 权限说明 |
|------|------|------|----------|
| 超级管理员 | admin | admin123 | 所有权限 |
| 校团委老师 | teacher001 | teacher123 | 审批权限 |
| 普通学生 | 2021001 | 123456 | 基础权限 |

## 📋 功能模块

### 1. 用户管理
- 用户CRUD操作
- 角色权限管理
- 账号封禁/解封
- 批量导入用户

### 2. 社团管理
- 社团信息管理
- 成员管理
- 角色分配
- 社团统计数据

### 3. 活动管理
- 活动发布与编辑
- 活动审批流程
- 活动报名
- 签到二维码
- 积分发放

### 4. 审批管理
- 活动审批
- 经费审批
- 物资借用审批

### 5. 经费管理
- 收支记录
- 经费统计
- 大额审批

### 6. 物资管理
- 物资信息管理
- 借用申请
- 归还记录

### 7. 积分系统
- 积分记录
- 积分统计
- 成长档案

## 🔧 配置说明

### 后端配置 (server/.env)

```env
PORT=3000                        # 服务端口
JWT_SECRET=your_secret_key       # JWT密钥
JWT_EXPIRES_IN=7d                # Token有效期

DB_HOST=localhost                # 数据库地址
DB_PORT=3306                     # 数据库端口
DB_USER=root                     # 数据库用户
DB_PASSWORD=your_password        # 数据库密码
DB_NAME=campus_club              # 数据库名称

UPLOAD_PATH=./uploads            # 文件上传路径
```

### 前端配置 (client/vite.config.js)

代理配置已预设，无需额外修改。

## 🌐 API 接口

所有接口统一前缀 `/api`，需要认证的接口需在请求头携带：

```
Authorization: Bearer {token}
```

主要接口：

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | /api/auth | 登录、登出、个人信息 |
| 用户 | /api/users | 用户管理（管理员） |
| 社团 | /api/clubs | 社团管理 |
| 活动 | /api/activities | 活动管理 |
| 审批 | /api/approvals | 审批管理 |
| 经费 | /api/funds | 经费管理 |
| 物资 | /api/equipment | 物资管理 |
| 积分 | /api/credits | 积分管理 |

## 📊 数据库表

系统共包含 11 张数据表：

1. `users` - 用户表
2. `clubs` - 社团表
3. `members` - 社团成员表
4. `activities` - 活动表
5. `activity_registrations` - 活动报名表
6. `approvals` - 审批表
7. `fund_records` - 经费记录表
8. `equipment` - 物资表
9. `borrow_records` - 借用记录表
10. `credit_logs` - 积分记录表
11. `announcements` - 公告表

## 🔒 权限说明

系统采用 RBAC 权限模型：

| 角色 | 权限范围 |
|------|----------|
| super_admin | 全部权限 |
| teacher | 审批、查看统计 |
| president | 管理本社团 |
| member | 参与活动 |
| user | 浏览、申请加入 |

## ❓ 常见问题

### 1. 数据库连接失败
- 检查 MySQL 服务是否启动
- 确认 .env 配置正确
- 检查数据库用户权限

### 2. 前端无法访问后端
- 确认后端服务已启动
- 检查端口是否被占用
- 查看浏览器控制台错误

### 3. 登录失败
- 确认用户已创建
- 检查密码是否正确
- 查看后端日志

## 📝 开发说明

### 添加新页面

1. 在 `client/src/views/` 创建页面组件
2. 在 `client/src/router/index.js` 添加路由
3. 在 `client/src/api/index.js` 添加接口

### 添加新接口

1. 在 `server/src/controllers/` 创建控制器
2. 在 `server/src/routes/` 创建路由
3. 在 `server/src/app.js` 注册路由

## 📄 License

MIT License

---

**开发者**: Campus Club Team  
**版本**: 1.0.0  
**更新日期**: 2024
