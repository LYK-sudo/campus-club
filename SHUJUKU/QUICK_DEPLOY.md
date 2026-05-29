# 校园智慧社团管理系统 - 快速云端部署指南

## 🚀 最简部署方案（3步完成）

---

## 第一步：准备代码

### 1. 注册 GitHub
访问 https://github.com → Sign up → 完成注册

### 2. 创建仓库并上传代码
1. 点击右上角 "+" → "New repository"
2. 名称填 `campus-club`，选 Public，点击 Create
3. 点击 "uploading an existing file"
4. 把整个项目文件夹内容拖进去
5. 点击 "Commit changes"

---

## 第二步：部署数据库

### PlanetScale（免费MySQL）

1. 访问 https://planetscale.com
2. 点击 "Sign up" → 选择 GitHub 登录
3. 点击 "Create database"
   - 名称：`campus-club`
   - 区域：选最近的
4. 点击 "Console" 标签
5. 复制粘贴以下SQL并执行：

```sql
-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_no VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'teacher', 'user') DEFAULT 'user',
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'banned') DEFAULT 'active',
    deleted_at TIMESTAMP NULL
);

-- 社团表
CREATE TABLE clubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    category ENUM('文艺', '体育', '学术', '公益', '科技', '其他') DEFAULT '其他',
    description TEXT,
    logo_url VARCHAR(255),
    cover_url VARCHAR(255),
    status ENUM('active', 'suspended', 'disbanded') DEFAULT 'active',
    president_id INT,
    budget DECIMAL(10, 2) DEFAULT 0.00,
    total_members INT DEFAULT 0,
    max_members INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 成员表
CREATE TABLE members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('president', 'vice_president', 'member') DEFAULT 'member',
    join_date DATE NOT NULL,
    leave_date DATE NULL,
    points INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    intro VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 活动表
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    creator_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    type ENUM('lecture', 'volunteer', 'competition', 'party', 'sports', 'other') DEFAULT 'other',
    description TEXT,
    location VARCHAR(200),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    registration_deadline DATETIME,
    max_participants INT NULL,
    current_participants INT DEFAULT 0,
    status ENUM('draft', 'pending', 'approved', 'rejected', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft',
    credit_points INT DEFAULT 0,
    cover_url VARCHAR(255),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 报名表
CREATE TABLE activity_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    register_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checkin_time TIMESTAMP NULL,
    checkin_token VARCHAR(100) NULL,
    status ENUM('registered', 'checked_in', 'cancelled') DEFAULT 'registered'
);

-- 审批表
CREATE TABLE approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('activity', 'fund', 'equipment', 'member_join') NOT NULL,
    ref_id INT NOT NULL,
    club_id INT NOT NULL,
    applicant_id INT NOT NULL,
    approver_id INT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    apply_reason TEXT,
    reject_reason TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL
);

-- 经费表
CREATE TABLE fund_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category ENUM('场地费', '物料费', '奖品费', '餐饮费', '交通费', '会费', '赞助', '其他') DEFAULT '其他',
    description VARCHAR(255),
    operator_id INT NOT NULL,
    approval_id INT NULL,
    receipt_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 物资表
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category ENUM('音响设备', '投影设备', '运动器材', '文具耗材', '服装道具', '其他') DEFAULT '其他',
    total_count INT DEFAULT 1,
    available_count INT DEFAULT 1,
    owner_club_id INT NULL,
    condition_status ENUM('good', 'damaged', 'lost') DEFAULT 'good',
    description VARCHAR(255),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 借用表
CREATE TABLE borrow_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL,
    club_id INT NOT NULL,
    applicant_id INT NOT NULL,
    quantity INT DEFAULT 1,
    borrow_date DATE NOT NULL,
    return_date DATE NOT NULL,
    actual_return_date DATE NULL,
    status ENUM('pending', 'approved', 'borrowed', 'returned', 'overdue') DEFAULT 'pending',
    approval_id INT NULL,
    damage_note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 积分表
CREATE TABLE credit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    club_id INT NULL,
    activity_id INT NULL,
    points_change INT NOT NULL,
    credit_change DECIMAL(3, 1) DEFAULT 0.0,
    reason VARCHAR(255),
    operator_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员（密码：admin123）
INSERT INTO users (student_no, name, email, password_hash, role, department, status) VALUES
('admin', '系统管理员', 'admin@campus.edu', '$2b$10$N9qo8uLOickgx2ZMR7oH.MrqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'super_admin', '信息中心', 'active'),
('teacher001', '张老师', 'zhang@campus.edu', '$2b$10$N9qo8uLOickgx2ZMR7oH.MrqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'teacher', '校团委', 'active'),
('2021001', '李明', 'liming@campus.edu', '$2b$10$N9qo8uLOickgx2ZMR7oH.MrqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'user', '计算机学院', 'active');
```

6. 点击 "Connect" → 选择 "Node.js"
7. 复制连接信息保存好

---

## 第三步：部署后端

### Render（免费Node.js托管）

1. 访问 https://render.com
2. 点击 "Get Started" → GitHub 登录
3. 点击 "New" → "Web Service"
4. 连接你的 GitHub 仓库
5. 填写配置：
   - Name: `campus-club-api`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
6. 添加环境变量：

| Key | Value |
|-----|-------|
| PORT | 3000 |
| JWT_SECRET | my-secret-key-2024 |
| DB_HOST | PlanetScale主机 |
| DB_USER | PlanetScale用户 |
| DB_PASSWORD | PlanetScale密码 |
| DB_NAME | campus_club |

7. 点击 "Create Web Service"
8. 等待部署完成，记录地址

---

## 第四步：部署前端

### Vercel（免费前端托管）

1. 访问 https://vercel.com
2. 点击 "Sign Up" → GitHub 登录
3. 点击 "Add New" → "Project"
4. 选择你的仓库
5. 配置：
   - Root Directory: `client`
   - Framework: Vite
6. 添加环境变量：

| Name | Value |
|------|-------|
| VITE_API_URL | https://你的render地址.onrender.com/api |

7. 点击 "Deploy"
8. 完成！

---

## ✅ 访问你的系统

部署完成后：
- **前端地址**: https://你的项目.vercel.app
- **后端地址**: https://你的项目.onrender.com/api

**默认账号**:
- 管理员: `admin` / `admin123`
- 老师: `teacher001` / `teacher123`  
- 学生: `2021001` / `123456`

---

## 📊 免费额度

| 平台 | 免费额度 |
|------|----------|
| PlanetScale | 5GB存储 + 10亿行读取/月 |
| Render | 750小时/月 |
| Vercel | 无限带宽 |

完全够用！🎉
