# 云端部署指南（完全免费，无需下载软件）

本指南将帮助你在云端部署校园智慧社团管理系统，完全免费，无需在本地安装任何软件。

---

## 📋 部署架构

```
用户浏览器
    ↓
Vercel (前端静态页面)
    ↓
Render (后端API服务)
    ↓
PlanetScale (MySQL数据库)
```

---

## 第一步：创建 GitHub 账号并上传代码

### 1.1 注册 GitHub
1. 访问 https://github.com
2. 点击 "Sign up" 注册账号
3. 验证邮箱

### 1.2 创建仓库
1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名称：`campus-club-management`
4. 选择 "Public"
5. 点击 "Create repository"

### 1.3 上传代码（两种方式）

**方式一：使用 GitHub网页上传**
1. 在仓库页面点击 "uploading an existing file"
2. 将整个项目文件夹拖拽上传
3. 点击 "Commit changes"

**方式二：使用 GitHub Desktop（可选）**
- 下载 GitHub Desktop：https://desktop.github.com/
- 克隆仓库后复制代码，然后推送

---

## 第二步：创建免费 MySQL 数据库（PlanetScale）

### 2.1 注册 PlanetScale
1. 访问 https://planetscale.com
2. 点击 "Sign up" → 选择 "Sign up with GitHub"
3. 授权 GitHub 登录

### 2.2 创建数据库
1. 点击 "Create database"
2. 数据库名称：`campus-club`
3. 区域：选择 `AWS - East (Ohio)` 或最近的区域
4. 点击 "Create database"

### 2.3 获取连接信息
1. 进入数据库页面
2. 点击 "Connect" → "Connect with" 选择 "Node.js"
3. 复制连接字符串，格式如下：
   ```
   mysql://用户名:密码@主机/数据库名?ssl={"rejectUnauthorized":true}
   ```
4. 记录以下信息：
   - `DB_HOST`: 主机地址
   - `DB_USER`: 用户名
   - `DB_PASSWORD`: 密码
   - `DB_NAME`: 数据库名

### 2.4 初始化数据库表
1. 在 PlanetScale 控制台点击 "Console"
2. 复制 `database/init.sql` 中的内容
3. 在 Console 中执行建表 SQL

---

## 第三步：部署后端到 Render

### 3.1 注册 Render
1. 访问 https://render.com
2. 点击 "Get Started" → 选择 "GitHub"
3. 授权 GitHub 登录

### 3.2 创建 Web Service
1. 点击 "New" → "Web Service"
2. 连接 GitHub 仓库：
   - 点击 "Connect" 找到 `campus-club-management`
   - 点击 "Connect"
3. 配置服务：
   - **Name**: `campus-club-api`
   - **Region**: `Oregon (US West)` 或最近区域
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 3.3 添加环境变量
在 "Environment Variables" 部分添加：

| Key | Value |
|-----|-------|
| PORT | 3000 |
| JWT_SECRET | campus_club_jwt_secret_2024_production |
| JWT_EXPIRES_IN | 7d |
| DB_HOST | PlanetScale提供的主机 |
| DB_PORT | 3306 |
| DB_USER | PlanetScale提供的用户名 |
| DB_PASSWORD | PlanetScale提供的密码 |
| DB_NAME | campus_club |
| NODE_ENV | production |
| FRONTEND_URL | (稍后填入Vercel地址) |

### 3.4 部署
1. 点击 "Create Web Service"
2. 等待部署完成（约3-5分钟）
3. 记录后端地址：`https://campus-club-api.onrender.com`

---

## 第四步：部署前端到 Vercel

### 4.1 注册 Vercel
1. 访问 https://vercel.com
2. 点击 "Sign Up" → 选择 "Continue with GitHub"
3. 授权 GitHub 登录

### 4.2 导入项目
1. 点击 "Add New" → "Project"
2. 选择 `campus-club-management` 仓库
3. 点击 "Import"

### 4.3 配置项目
- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4.4 添加环境变量
在 "Environment Variables" 添加：

| Name | Value |
|------|-------|
| VITE_API_URL | https://campus-club-api.onrender.com/api |

### 4.5 部署
1. 点击 "Deploy"
2. 等待部署完成（约1-2分钟）
3. 获得前端地址：`https://campus-club-management.vercel.app`

### 4.6 更新后端 CORS
1. 回到 Render
2. 在后端服务的 Environment Variables 中
3. 更新 `FRONTEND_URL` 为 Vercel 地址
4. 保存后服务会自动重新部署

---

## 第五步：修改前端 API 配置

需要修改前端的 API 请求配置，让它指向 Render 后端：

### 修改 `client/src/utils/request.js`

将：
```javascript
const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})
```

改为：
```javascript
const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
})
```

### 修改 `client/vite.config.js`

移除代理配置，因为云端不需要：
```javascript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
```

---

## 🎉 完成！

部署完成后，你将获得：

| 服务 | 地址 |
|------|------|
| 前端 | https://campus-club-management.vercel.app |
| 后端 | https://campus-club-api.onrender.com/api |

### 默认登录账号
- 管理员：`admin` / `admin123`
- 老师：`teacher001` / `teacher123`
- 学生：`2021001` / `123456`

---

## 📊 免费额度说明

### PlanetScale（数据库）
- ✅ 5GB 存储
- ✅ 10亿行读取/月
- ✅ 1000万行写入/月
- ✅ 自动备份

### Render（后端）
- ✅ 750小时/月
- ⚠️ 闲置时会休眠（首次访问需等待30秒唤醒）
- ✅ 自动部署

### Vercel（前端）
- ✅ 无限带宽
- ✅ 自动部署
- ✅ 全球CDN

---

## 🔄 更新代码

当你修改代码后：
1. 提交到 GitHub
2. Vercel 和 Render 会自动检测并重新部署

---

## ❓ 常见问题

### Q: 后端首次访问很慢？
A: Render 免费层在闲置后会休眠，首次访问需要30秒唤醒。之后会很快。

### Q: 数据库连接失败？
A: 检查 PlanetScale 的连接字符串是否正确配置到 Render 环境变量。

### Q: 前端无法访问后端？
A: 检查 CORS 配置，确保 `FRONTEND_URL` 正确设置。

### Q: 如何查看日志？
A: 
- Render: 点击服务 → "Logs"
- Vercel: 点击部署 → "Functions" → "Logs"

---

## 🆚 其他免费平台备选

如果上述平台不可用，可以尝试：

### 后端备选
| 平台 | 地址 | 特点 |
|------|------|------|
| Railway | https://railway.app | 简单易用，$5免费额度 |
| Fly.io | https://fly.io | 全球部署，3个免费VM |
| Koyeb | https://koyeb.com | 欧洲部署，免费层 |

### 数据库备选
| 平台 | 地址 | 特点 |
|------|------|------|
| Neon | https://neon.tech | PostgreSQL，免费层 |
| Supabase | https://supabase.com | PostgreSQL + 认证 |
| MongoDB Atlas | https://mongodb.com | MongoDB免费层 |

### 前端备选
| 平台 | 地址 | 特点 |
|------|------|------|
| Netlify | https://netlify.com | 类似Vercel |
| Cloudflare Pages | https://pages.cloudflare.com | 全球CDN |

---

**祝你部署顺利！** 🚀
