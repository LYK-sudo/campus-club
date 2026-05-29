-- 校园智慧社团综合管理系统数据库建表脚本
-- 数据库：MySQL 8.0

-- 创建数据库
CREATE DATABASE IF NOT EXISTS campus_club DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_club;

-- 1. 用户表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_no VARCHAR(20) NOT NULL UNIQUE COMMENT '学号',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt加密密码',
    role ENUM('super_admin', 'teacher', 'user') DEFAULT 'user' COMMENT '全局角色',
    avatar_url VARCHAR(255) COMMENT '头像地址',
    phone VARCHAR(20) COMMENT '手机号',
    department VARCHAR(100) COMMENT '院系',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    status ENUM('active', 'banned') DEFAULT 'active' COMMENT '账号状态',
    deleted_at TIMESTAMP NULL COMMENT '软删除时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 社团表
DROP TABLE IF EXISTS clubs;
CREATE TABLE clubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '社团名称',
    category ENUM('文艺', '体育', '学术', '公益', '科技', '其他') DEFAULT '其他' COMMENT '分类',
    description TEXT COMMENT '简介',
    logo_url VARCHAR(255) COMMENT 'Logo图片地址',
    cover_url VARCHAR(255) COMMENT '封面图片地址',
    status ENUM('active', 'suspended', 'disbanded') DEFAULT 'active' COMMENT '状态',
    president_id INT COMMENT '当前负责人ID',
    budget DECIMAL(10, 2) DEFAULT 0.00 COMMENT '当前经费余额',
    total_members INT DEFAULT 0 COMMENT '成员总数',
    max_members INT DEFAULT 100 COMMENT '最大成员数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '成立时间',
    FOREIGN KEY (president_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社团表';

-- 3. 社团成员表
DROP TABLE IF EXISTS members;
CREATE TABLE members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL COMMENT '社团ID',
    user_id INT NOT NULL COMMENT '用户ID',
    role ENUM('president', 'vice_president', 'member') DEFAULT 'member' COMMENT '社团内角色',
    join_date DATE NOT NULL COMMENT '入团日期',
    leave_date DATE NULL COMMENT '退团日期',
    points INT DEFAULT 0 COMMENT '积分',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '成员状态',
    intro VARCHAR(255) COMMENT '个人简介/职责描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_club_user_active (club_id, user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社团成员表';

-- 4. 活动表
DROP TABLE IF EXISTS activities;
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL COMMENT '社团ID',
    creator_id INT NOT NULL COMMENT '创建者ID',
    title VARCHAR(200) NOT NULL COMMENT '活动名称',
    type ENUM('lecture', 'volunteer', 'competition', 'party', 'sports', 'other') DEFAULT 'other' COMMENT '活动类型',
    description TEXT COMMENT '活动详情',
    location VARCHAR(200) COMMENT '地点',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    registration_deadline DATETIME COMMENT '报名截止时间',
    max_participants INT NULL COMMENT '人数上限',
    current_participants INT DEFAULT 0 COMMENT '当前报名人数',
    status ENUM('draft', 'pending', 'approved', 'rejected', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft' COMMENT '状态',
    credit_points INT DEFAULT 0 COMMENT '参与可获积分',
    cover_url VARCHAR(255) COMMENT '活动封面图',
    is_public BOOLEAN DEFAULT TRUE COMMENT '是否对全校开放',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动表';

-- 5. 活动报名表
DROP TABLE IF EXISTS activity_registrations;
CREATE TABLE activity_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    register_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    checkin_time TIMESTAMP NULL COMMENT '签到时间',
    checkin_token VARCHAR(100) NULL COMMENT '签到token',
    status ENUM('registered', 'checked_in', 'cancelled') DEFAULT 'registered' COMMENT '状态',
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_activity_user (activity_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动报名表';

-- 6. 审批表
DROP TABLE IF EXISTS approvals;
CREATE TABLE approvals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('activity', 'fund', 'equipment', 'member_join') NOT NULL COMMENT '审批类型',
    ref_id INT NOT NULL COMMENT '关联申请ID',
    club_id INT NOT NULL COMMENT '社团ID',
    applicant_id INT NOT NULL COMMENT '申请人ID',
    approver_id INT NULL COMMENT '审批人ID',
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    apply_reason TEXT COMMENT '申请说明',
    reject_reason TEXT COMMENT '驳回原因',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    reviewed_at TIMESTAMP NULL COMMENT '审批时间',
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批表';

-- 7. 经费记录表
DROP TABLE IF EXISTS fund_records;
CREATE TABLE fund_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    club_id INT NOT NULL COMMENT '社团ID',
    type ENUM('income', 'expense') NOT NULL COMMENT '收支类型',
    amount DECIMAL(10, 2) NOT NULL COMMENT '金额',
    category ENUM('场地费', '物料费', '奖品费', '餐饮费', '交通费', '会费', '赞助', '其他') DEFAULT '其他' COMMENT '分类',
    description VARCHAR(255) COMMENT '备注',
    operator_id INT NOT NULL COMMENT '操作人ID',
    approval_id INT NULL COMMENT '审批ID',
    receipt_url VARCHAR(255) COMMENT '票据图片',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经费记录表';

-- 8. 物资表
DROP TABLE IF EXISTS equipment;
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '物资名称',
    category ENUM('音响设备', '投影设备', '运动器材', '文具耗材', '服装道具', '其他') DEFAULT '其他' COMMENT '分类',
    total_count INT DEFAULT 1 COMMENT '总数量',
    available_count INT DEFAULT 1 COMMENT '可借数量',
    owner_club_id INT NULL COMMENT '归属社团ID',
    condition_status ENUM('good', 'damaged', 'lost') DEFAULT 'good' COMMENT '状态',
    description VARCHAR(255) COMMENT '说明',
    image_url VARCHAR(255) COMMENT '图片',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_club_id) REFERENCES clubs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物资表';

-- 9. 借用记录表
DROP TABLE IF EXISTS borrow_records;
CREATE TABLE borrow_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL COMMENT '物资ID',
    club_id INT NOT NULL COMMENT '借用社团ID',
    applicant_id INT NOT NULL COMMENT '申请人ID',
    quantity INT DEFAULT 1 COMMENT '借用数量',
    borrow_date DATE NOT NULL COMMENT '预计借用日期',
    return_date DATE NOT NULL COMMENT '预计归还日期',
    actual_return_date DATE NULL COMMENT '实际归还日期',
    status ENUM('pending', 'approved', 'borrowed', 'returned', 'overdue') DEFAULT 'pending' COMMENT '状态',
    approval_id INT NULL COMMENT '审批ID',
    damage_note VARCHAR(255) COMMENT '损坏说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='借用记录表';

-- 10. 积分记录表
DROP TABLE IF EXISTS credit_logs;
CREATE TABLE credit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    club_id INT NULL COMMENT '社团ID',
    activity_id INT NULL COMMENT '活动ID',
    points_change INT NOT NULL COMMENT '积分变动',
    credit_change DECIMAL(3, 1) DEFAULT 0.0 COMMENT '学分变动',
    reason VARCHAR(255) COMMENT '原因',
    operator_id INT NULL COMMENT '操作人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分记录表';

-- 11. 系统公告表
DROP TABLE IF EXISTS announcements;
CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT COMMENT '内容',
    type ENUM('system', 'activity', 'club') DEFAULT 'system' COMMENT '类型',
    publisher_id INT NOT NULL COMMENT '发布人ID',
    is_top BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
    status ENUM('draft', 'published') DEFAULT 'published' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publisher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统公告表';

-- 创建索引
CREATE INDEX idx_users_student_no ON users(student_no);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clubs_category ON clubs(category);
CREATE INDEX idx_clubs_status ON clubs(status);
CREATE INDEX idx_members_club_id ON members(club_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_activities_club_id ON activities(club_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_start_time ON activities(start_time);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_type ON approvals(type);
CREATE INDEX idx_fund_records_club_id ON fund_records(club_id);
CREATE INDEX idx_equipment_owner ON equipment(owner_club_id);
CREATE INDEX idx_borrow_records_equipment ON borrow_records(equipment_id);
CREATE INDEX idx_credit_logs_user ON credit_logs(user_id);

-- 插入初始数据
-- 插入超级管理员（密码：admin123，bcrypt加密后的值）
INSERT INTO users (student_no, name, email, password_hash, role, department, status) VALUES
('admin', '系统管理员', 'admin@campus.edu', '$2b$10$rQZ9X8Y2W5vK3nM7pL4hOeTqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'super_admin', '信息中心', 'active');

-- 插入校团委老师（密码：teacher123）
INSERT INTO users (student_no, name, email, password_hash, role, department, status) VALUES
('teacher001', '张老师', 'zhang@campus.edu', '$2b$10$rQZ9X8Y2W5vK3nM7pL4hOeTqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'teacher', '校团委', 'active');

-- 插入测试学生用户（密码：123456）
INSERT INTO users (student_no, name, email, password_hash, role, department, status) VALUES
('2021001', '李明', 'liming@campus.edu', '$2b$10$rQZ9X8Y2W5vK3nM7pL4hOeTqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'user', '计算机学院', 'active'),
('2021002', '王芳', 'wangfang@campus.edu', '$2b$10$rQZ9X8Y2W5vK3nM7pL4hOeTqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'user', '艺术学院', 'active'),
('2021003', '刘强', 'liuqiang@campus.edu', '$2b$10$rQZ9X8Y2W5vK3nM7pL4hOeTqJmNcBvAxDwEyFzGhIjKlMnOpQrSt', 'user', '体育学院', 'active');

-- 插入示例社团
INSERT INTO clubs (name, category, description, status, budget, total_members) VALUES
('计算机协会', '科技', '致力于计算机技术学习与交流，定期举办编程竞赛、技术讲座等活动', 'active', 5000.00, 50),
('舞蹈社', '文艺', '热爱舞蹈艺术的同学们的聚集地，涵盖街舞、民族舞、现代舞等多种风格', 'active', 3000.00, 35),
('篮球俱乐部', '体育', '为篮球爱好者提供交流平台，组织校内篮球联赛和友谊赛', 'active', 2000.00, 40);

-- 插入示例物资
INSERT INTO equipment (name, category, total_count, available_count, owner_club_id, condition_status, description) VALUES
('投影仪', '投影设备', 5, 5, NULL, 'good', '学校公共投影设备'),
('音响套装', '音响设备', 3, 3, NULL, 'good', '含音箱、功放、麦克风'),
('篮球', '运动器材', 20, 20, 3, 'good', '篮球俱乐部专用');

-- 完成提示
SELECT '数据库初始化完成！' AS message;
