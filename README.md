# Carevial

**让全家人的药箱、提醒和用药记录，装进同一个智能助手里。**

家里老人记不住几点吃药、药盒里堆着说不清过没过期的药、过敏史只在口头相传——这些琐碎却关键的事，正是 Carevial 想解决的。它是一款**开源的智能家庭用药管理全栈应用**：从家庭成员档案、药品与过期提醒，到打卡记录与到点通知，再到能真正「动手帮忙」的 AI 助手，把日常用药管理串成一条完整链路。

适合：需要家庭用药工具的用户；想学习 **Vue 3 + Express 真实业务闭环**、Cookie 鉴权、SSE、Agent 工具调用与 RAG 的开发者。

## 为什么值得看

- **家庭视角，而不只是「个人药箱」**  
  多成员档案 + 健康信息（过敏 / 慢病 / 禁忌），药品可归属到人，也支持家庭公用。

- **提醒不是摆设：到点能推到浏览器**  
  按星期与时间排程，结合提前量计算；服务端定时扫描 + Redis 防重 + **SSE** 推送，页内系统通知，还可选语音播报。

- **AI 不只是聊天，还能改你的数据（且必须你点确认）**  
  DeepSeek 流式对话 + Function calling：查药、建提醒、打卡等走工具；**写操作二次确认**，避免模型乱动库。

- **医疗问答可接知识库（RAG）**  
  可选 Chroma + Embedding，把说明书类知识检索进回答；带评测脚本，方便你自己灌库与验证召回。

- **工程完整，接近可上线形态**  
  注册登录（密码 / 邮箱码）、HttpOnly Cookie、COS 图片、限流与 Helmet、落地页与反馈页——不是 demo 拼盘，而是前后端同仓的完整产品骨架。

- **MIT 开源，方便学习与二次开发**  
  技术栈主流、结构清晰，改业务或拆模块都友好。

## 功能一览

| 模块 | 你能做什么 |
| --- | --- |
| 账号与设置 | 邮箱注册、密码 / 验证码登录、头像与通知偏好 |
| 家庭与档案 | 成员管理、健康档案 |
| 药品 | 增删改查、照片、有效期状态自动计算 |
| 提醒与打卡 | 每周计划、日历打卡、到点通知 |
| AI 助手 | 流式对话、工具调用、会话落库、可选医疗 RAG |
| 公开页 | 产品落地页、意见反馈 |

> **免责声明**：本项目中的 AI 与知识库内容仅供学习与辅助参考，**不能替代执业医师或药师的诊断与用药指导**。请遵医嘱用药。

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端 | Vue 3 · Vite · Vue Router · Pinia · Axios · Tailwind CSS v4 · Element Plus（按需） |
| 后端 | Node.js · Express 5 · mysql2 · Redis（ioredis）· JWT · Resend · Multer / Sharp · 腾讯云 COS |
| AI | DeepSeek API · Function calling · Chroma（可选 RAG） |

仓库结构：

```text
Carevial/
├── frontend/          # Vue 应用（开发默认 :5173）
├── backend/           # Express API（默认 :3000）
├── docs/              # （可选）补充文档
├── LICENSE            # MIT
└── README.md
```

## 环境要求

- Node.js **20 LTS** 及以上
- MySQL **8**
- Redis
- （可选）Chroma，仅在需要医疗 RAG 时
- （可选）腾讯云 COS、Resend、DeepSeek、Embedding / OpenFDA 等第三方账号

本地开发时，前端通过 Vite 把 `/api` **代理**到后端，浏览器不要直连 `:3000` 调需 Cookie 的接口。

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/hihixhy/Carevial.git
cd Carevial
```

### 2. 准备 MySQL

创建数据库后执行下方 [数据库建表](#数据库建表) 中的 SQL（或导入你自己的结构备份）。

### 3. 启动 Redis

保证本机 Redis 可连接，例如默认 `redis://127.0.0.1:6379`。

### 4. 配置后端环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env`，至少配置：

| 变量 | 说明 |
| --- | --- |
| `PORT` | 后端端口，默认 `3000` |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL |
| `JWT_SECRET` | 随机长字符串 |
| `REDIS_URL` | 如 `redis://127.0.0.1:6379` |
| `FRONTEND_URL` | 前端源，本地一般为 `http://localhost:5173`（**无末尾 `/`**） |
| `NODE_ENV` | 本地用 `development` |
| `COOKIE_SECURE` | 本地 `false`；HTTPS 生产环境 `true` |
| `RESEND_API_KEY` / `EMAIL_FROM` | 发送邮箱验证码 |
| `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` / `TENCENT_COS_REGION` / `TENCENT_COS_BUCKET` | 头像与药品图（不用上传可暂留空，相关功能会不可用） |
| `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` | AI 对话 |
| `CHROMA_*` / `EMBEDDING_*` / `OPENFDA_API_KEY` / `RAG_*` | 可选，医疗 RAG |

**不要**将真实 `.env` 提交到 Git。

### 5. 启动后端

```bash
cd backend
npm install
npm run dev
```

健康检查：`GET http://localhost:3000/health` → `{ "ok": true }`。

### 6. 启动前端

另开终端：

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 [http://localhost:5173](http://localhost:5173)，注册账号后即可使用。

### 常用脚本

**后端**（`backend/`）：

```bash
npm run dev      # 开发（node --watch）
npm start        # 生产启动
npm run lint
npm run format
```

**前端**（`frontend/`）：

```bash
npm run dev
npm run build    # 产物在 frontend/dist
npm run preview
npm run lint
npm run format
```

## 数据库建表

以下结构与当前 Carevial 实现对齐（提醒 `days` 为 **0–6，0=周日**；药品表**无** `expiry_status` 列；AI 会话 `updated_at` **不要**加 `ON UPDATE CURRENT_TIMESTAMP`）。

```sql
CREATE DATABASE IF NOT EXISTS carevial
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carevial;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50),
  email VARCHAR(100) UNIQUE,
  avatar_url VARCHAR(500) NULL,
  password_hash VARCHAR(255),
  notification_enabled TINYINT(1) NOT NULL DEFAULT 1,
  sound_enabled TINYINT(1) NOT NULL DEFAULT 1,
  reminder_before_minutes INT NOT NULL DEFAULT 5,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  age INT,
  relationship VARCHAR(50) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE health_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  member_id INT NOT NULL,
  blood_type VARCHAR(10) NULL,
  allergies JSON NULL,
  chronic_conditions JSON NULL,
  contraindications JSON NULL,
  medical_notes VARCHAR(700),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_member (member_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

CREATE TABLE medicines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  member_id INT NULL,
  name VARCHAR(100) NOT NULL,
  specification VARCHAR(100),
  expiry_date DATE NOT NULL,
  dosage VARCHAR(200),
  indications VARCHAR(400),
  medicine_type ENUM('prescription', 'otc', 'healthcare') NOT NULL,
  remark VARCHAR(700),
  photo_url VARCHAR(500),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE SET NULL
);

CREATE TABLE reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  medicine_id INT NOT NULL,
  user_id INT NOT NULL,
  time TIME NOT NULL,
  days TINYINT NOT NULL COMMENT '0-6 = Sun-Sat',
  enabled BOOLEAN DEFAULT TRUE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE medicine_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reminder_id INT NULL,
  medicine_id INT NOT NULL,
  user_id INT NOT NULL,
  scheduled_time TIME,
  log_date DATE NOT NULL,
  taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('taken', 'missed') DEFAULT 'taken',
  UNIQUE KEY uk_reminder_log_date (reminder_id, log_date),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE SET NULL
);

CREATE TABLE ai_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  public_id CHAR(32) NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(50) NOT NULL DEFAULT '新对话',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_public_id (public_id),
  INDEX idx_user_updated (user_id, updated_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE ai_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  pending_action JSON NULL,
  action_status VARCHAR(20) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conv_created (conversation_id, created_at),
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);
```

邮箱验证码、图形验证码存在 **Redis**，不进 MySQL。

## 前端路由（简要）

| 路径 | 说明 |
| --- | --- |
| `/` | 落地页（登录 / 注册弹窗） |
| `/feedback` | 意见反馈 |
| `/dashboard` | 工作台（需登录） |
| `/dashboard/family` | 家庭成员 |
| `/dashboard/family-health` | 健康档案 |
| `/dashboard/medicines` | 药品列表等 |
| `/dashboard/reminders` | 用药提醒 |
| `/dashboard/checkin` | 打卡 |
| `/dashboard/ai` | AI 助手 |
| `/dashboard/settings` | 设置 |

鉴权：登录态为 Cookie `token`；未登录访问需登录页时会回到 `/` 并带 `redirect`。

## 生产部署提示

1. 前端 `npm run build`，用 Nginx（或同类）托管 `frontend/dist`，`try_files` 支持 Vue History 路由。
2. 将 `/api` 反代到 Node 进程（如 pm2 守护 `backend/server.js`）。
3. 生产环境建议：
   - `NODE_ENV=production`
   - `COOKIE_SECURE=true`（需 HTTPS）
   - `FRONTEND_URL` 与浏览器地址栏源**完全一致**（含 `https`、有无 `www`，无尾 `/`）
   - 反代时设置 `X-Forwarded-*`，并与 Express `trust proxy` 配合
4. 同域反代（`https://your.domain/api` → 后端）可继续使用前端的 `baseURL: '/api'`，无需改代码。

更细的云主机 / DNS / 证书步骤可按你的云厂商文档操作；部署时勿把密钥写入仓库或 Issue。

## 可选：医疗 RAG

若启用 Chroma 与 Embedding 相关环境变量，可在 `backend` 下使用仓库内脚本灌库与评测（需本机 Chroma 已启动），例如：

```bash
cd backend
node scripts/ingestMedicalKb.js
node scripts/evalRaggolden.js
```

未配置时，其它业务仍可运行；与向量检索相关的 AI 能力会受限或不可用。

## 参与贡献

欢迎 Issue / PR。建议：

1. Fork 后从最新 `main` 拉分支开发
2. 保持前端无分号、后端 CommonJS + 分号的现有风格
3. 不要提交 `.env`、密钥或个人数据 dump
4. PR 说明改动动机与自测方式

## License

[MIT](./LICENSE) © 2026 Huiyu Xia
