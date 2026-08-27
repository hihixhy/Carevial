# Carevial 项目记忆（给后续 AI 用）

> **用法**：新对话或上下文被压缩后，先读本文件，再动手改代码。  
> 更新日期：2026-08-28。有重大决策时同步改这里。  
> 对话原文（很大）：`C:\Users\HONOR\.cursor\projects\d-vue-project-carevial\agent-transcripts\0ab0c5b3-7d02-46d3-ba0b-41246392c493\0ab0c5b3-7d02-46d3-ba0b-41246392c493.jsonl`

---

## 1. 项目是什么

Carevial（产品名，不是「药管家」）是 **智能家庭用药管理** 全栈应用。

| 路径 | 作用 |
|------|------|
| `D:\vue-project\carevial` | **本仓库，当前工作区** |
| `D:\vue-project\medicine-reminder` | 用户之前的参考项目。可对照表结构、接口风格。**禁止改它的代码**。 |

用户是开发者本人：后端业务倾向自己写、AI 讲步骤；前端 UI 由 AI 按预览站用 Vue 复刻。回复语言：**简体中文**。

---

## 2. 硬性约定（违反会惹用户）

1. **不要改现有页面路由结构**（`frontend/src/router/index.js`）。登录后前缀是 `/dashboard/...`，不是预览站的 `/family`、`/medicines`。
2. **不要改 `medicine-reminder` 仓库。**
3. **不要提交 `.env`**，不要把真实密钥写进文档。`.env` 是真配置；`.env.example` 才是示例。
4. **后端**：CommonJS + **必须有分号**（`backend/.prettierrc.json` 里 `semi: true`）。
5. **前端**：ESM + **无分号**（`frontend/.prettierrc.json` 里 `semi: false`）。
6. 用户明确不要 Docker。本机 Redis：`D:\redis\redis-server.exe`，`redis-cli ping` → PONG。
7. 只在用户要求时 git commit / push。
8. 改登录后 UI 时，对照 **最新** Readdy 预览 **13260973**，不要用旧版 `12816190`。

---

## 3. 技术栈

### 前端 `carevial/frontend`

- Vue 3 + Vite 8 + **JavaScript**（不是 TypeScript）
- Vue Router 5、Pinia
- axios：`frontend/src/api/request.js`，`baseURL: '/api'`，`withCredentials: true`
- Tailwind CSS **v4**（`@tailwindcss/vite`）
- Remix Icon（`ri-*`）；登录提示用 Element Plus `ElMessage`（不要当表单皮肤）
- 主题色：`frontend/src/assets/main.css` 的 `@theme` oklch 色板
- 字体：DM Sans + Playfair Display
- Vite `resolve.alias`：`@` → `frontend/src`（`fileURLToPath` 从 `node:url` 导入，不是从 `vite`）
- 开发代理：`/api` → `http://localhost:3000`（Cookie `SameSite=Lax` 跨端口带不上，**不要**让浏览器直连 3000 调鉴权）

### 后端 `carevial/backend`

- Node + Express 5 + CommonJS
- mysql2、ioredis、jsonwebtoken、**bcryptjs**、resend、dotenv、cors、**cookie-parser**、**svg-captcha**
- 入口：`server.js` → `app.js` → `routes/index.js`
- 开发：`npm run dev`（`node --watch server.js`），默认 `http://localhost:3000`

### 本地服务

- 前端：Vite 常见 `http://localhost:5173`（占用时会 5174）
- 后端：`http://localhost:3000`
- Redis：本机已安装，不要建议 Docker

---

## 4. 前端路由（保持这个结构）

公开：

- `/` 落地页 `LandingView`（弹窗登录/注册）
- `/feedback` 反馈页

登录后（`AppLayout` + `meta.requiresAuth`）：

| path | name | 视图 |
|------|------|------|
| `/dashboard` | dashboard | DashboardView |
| `/dashboard/family` | family | FamilyView |
| `/dashboard/family-health` | family-health | FamilyHealthView |
| `/dashboard/medicines` | medicines | MedicinesView |
| `/dashboard/medicines/add` | medicines-add | MedicineAddView |
| `/dashboard/medicines/:id` | medicines-detail | MedicineDetailView |
| `/dashboard/reminders` | reminders | RemindersView |
| `/dashboard/checkin` | checkin | CheckinView |
| `/dashboard/ai` | ai | AiView |
| `/dashboard/settings` | settings | SettingsView |

守卫：未 `bootstrapped` 先 `userStore.getUser()`（打 `/auth/me`）。`requiresAuth` 且未登录 → `/`，带 `?redirect=`。登录成功用 `isSafeInternalPath` 回跳，否则 `name: 'dashboard'`。

`main.js`：**先 `pinia` 再 `router`**。

预览站路由没有 `/dashboard` 前缀。Vue 里跳转必须加此前缀。

---

## 5. 前端现状（2026-08-28）

### 鉴权（已接真接口，不再用 mock token）

- **没有** `useAuth.js` / localStorage token。会话是后端 **HttpOnly Cookie** `token`。
- Pinia `frontend/src/stores/user.js`：`user`、`bootstrapped`、`isAuthenticated`；`login` / `loginCode` 把 `res.data.user` 写入 store；`getUser` 调 `GET /auth/me`。
- API：`frontend/src/api/auth.js` + `request.js`。拦截器成功返回 `{ code, message, data }`；失败 `reject(new Error(message))`。
- 侧栏展示 `userStore.user.username`（不是 `name`）。

### 登录弹窗 `AuthModal.vue`

- 登录：密码 / 验证码切换。密码登录 **没有** 图形码。
- 注册字段：昵称 → 邮箱 → 密码 → 确认密码 → 图形验证码 → 邮箱验证码。
- 前后端校验对齐：`frontend/src/utils/validate.js` 用 `export { ... }`（不能 `module.exports`）。用户名 trim 后 1–10（中间空格允许）；密码 6–12 且大小写+数字；邮箱码 6 位数字。
- 发码：`sendCode({ email, purpose, captchaId, captchaCode })`。`purpose`：登录弹窗为 `login`，注册为 `register`。
- `sendingCode`：发码请求进行中锁按钮，防同一张图连点两次。
- `captchaReset`：通知 `CaptchaField` 换新图（发码后图已被后端核销）。不要删。
- 注册成功 **不进 dashboard**，切回登录并保留邮箱。
- 本地校验错误用弹窗内一行小字；接口成功/失败用 `ElMessage`。

### 图形验证码 `CaptchaField.vue`

- **服务端出图**：`GET /auth/captcha` → `{ captchaId, image }`（data URL）。答案只在 Redis。
- 前端不本地对答案。满 4 位 `emit('ready-change', true)` 只表示可点发送。
- `defineExpose({ getPayload })` 给父组件 id + 用户输入。
- `refreshSeq`：连点换图只采纳最后一次请求；拉图失败清空 `captchaId` / `image`。
- 设置页改邮箱仍用该组件，但改邮箱接口 **尚未接**（相关 handler 注释掉了）。

### 布局

- `AppLayout.vue`：侧栏 `collapsed` 在布局；`h-screen overflow-hidden`；展开 `lg:ml-[220px]`，收起 `lg:ml-16`。
- `Sidebar.vue`、`LogoutConfirmModal.vue`（侧栏 + 设置共用）。
- `AiBanner.vue`：右下角「AI 助手」FAB（Dashboard）。

### 登录后页面

已按预览 13260973 对齐过一轮（按钮始终可见、药品无「库存」、设置退出二次确认等）。药品/家庭/提醒/打卡数据仍来自 `frontend/src/mocks/`。

### 登录回跳

`frontend/src/utils/navigation.js` → `isSafeInternalPath`

---

## 6. UI 对照（Readdy 预览）

**当前应对齐的版本（13260973）：**

- 落地页/登录：https://readdy.cc/preview/d49be038-2eba-450c-bb6c-e42ec62a8b54/13260973
- Dashboard：https://readdy.cc/preview/d49be038-2eba-450c-bb6c-e42ec62a8b54/13260973/dashboard

旧版 `12816190` 不要再用。

本地曾从 source map 抽出 React 源码（`tmp-preview-src`、`tmp-preview-src-13260973` 及 `tmp-extract-*.mjs`）。**不是产品代码**，可删。根 `.gitignore` 已忽略 `tmp-preview-src`。预览是 React；本项目用 Vue + Tailwind 复刻结构/class。

---

## 7. 后端鉴权（已落地）

### 路由挂载

`backend/routes/index.js` 只挂了 `app.use('/api/auth', authRoutes)`。没有 `GET /health`。

`app.js`：`cookie-parser`；CORS `origin: process.env.FRONTEND_URL` + `credentials: true`。

### Auth 接口 `backend/routes/authRoutes.js`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/captcha` | 公开。`data: { captchaId, image }` |
| POST | `/api/auth/send-code` | `{ email, purpose, captchaId, captchaCode }`。**先验图形码**（失败统一 400「图形验证码错误或已过期」），再查邮箱是否已注册/未注册，再发邮件 |
| POST | `/api/auth/register` | `{ username, email, password, confirmPassword, code }`。不带图形码。不发 JWT |
| POST | `/api/auth/login` | `{ email, password }`。Set-Cookie，JSON 只返回 `user` |
| POST | `/api/auth/login-code` | `{ email, code }`。不带图形码。同上 |
| GET | `/api/auth/me` | Cookie，需 `authMiddleware` |
| POST | `/api/auth/logout` | **不挂** auth 中间件；`clearCookie` 选项与 set 一致 |

统一响应：`{ code, message, data }`。HTTP 状态与 `code` 字段一起用。

### purpose

`register` | `login` | `change_email`（改邮箱发码尚未接前端）

占用检查在 **点发送** 时做：`register` 已注册则不发；`login` 未注册则不发。提交注册/验证码登录时再验邮箱码、再查库兜底。

### 校验 `utils/validate.js`

- 用户名：trim 后 1–10
- 密码：6–12，必须同时有大小写字母和数字
- 邮箱验证码：6 位数字

### Redis

- 邮箱码：`email_code:{purpose}:{email}`，TTL 300s；冷却 `email_code_send:{purpose}:{email}`，60s
- `checkCode` / `consumeCode` / `verifyCode`：注册先 check 再 create 再 consume；登录用 verify（成功即删）
- 图形码：`captcha:{uuid}`，存小写答案，TTL 300s。`verifyCaptcha` **对错都 del**（一次一码）

### 邮件

Resend。`EMAIL_FROM`、`RESEND_API_KEY`。`from` 建议 `Carevial <notify@域名>`，否则 QQ 显示名可能只是 `notify`。

### JWT / Cookie

`jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })`。Cookie 名 `token`：`httpOnly`，开发 `secure: false`，`sameSite: 'lax'`，`path: '/'`，7 天。JSON **不返回 token**。中间件读 `req.cookies.token`。上线再开 `secure: true`。

### 用户模型 `models/User.js`

- `create({ username, email, password })` → insertId，**bcryptjs** 写入 `password_hash`
- `findByEmail`、`findById`；表字段 **`username`**，不是 `name`

### 已知坑

1. 开发必须走 Vite 代理 + `withCredentials`，不要前端 `baseURL` 直连 `:3000`。
2. 注册成功不发 JWT，必须再登录才能进 dashboard（当前产品如此）。
3. 设置页改密码、改邮箱 **未接 API**。
4. `GET /captcha` 未做 IP 限流。
5. `server.js` 里有从 medicine-reminder 抄来的过期任务 / WebSocket 注释，Carevial 还没做。

---

## 8. 环境变量（backend）

见 `backend/.env.example`：`PORT`、`DB_*`、`JWT_SECRET`、`RESEND_API_KEY`、`EMAIL_FROM`、`REDIS_URL`、**`FRONTEND_URL`**（CORS）。  
腾讯云 COS 占位（药品照片以后可能用），鉴权没用 COS。

---

## 9. 数据设计意向

业务表尚未在 Carevial 落地。参考 medicine-reminder：`users`、`family_members`、`medicines`、`reminders`、`medicine_logs`。

用户表：`id, username, email, password_hash, created_at`（与 `User.js` 一致）。

邮箱码、图形码都不进 MySQL，只进 Redis。

药品「库存」已从预览 UI 去掉，不要加回表单，除非产品再要求。

---

## 10. 开发时间线（压缩）

1. Vue 复刻 Readdy 落地页 + Logo。
2. Express 骨架、MySQL/Redis；用户写 User / mail / emailCode / validate / auth。
3. 前端登录后全页（mock），路由 `/dashboard` 前缀。
4. Prettier + ESLint：前端无分号，后端有分号。
5. Redis 用本机 `D:\redis`，不用 Docker。
6. UI 对齐预览 **13260973**。
7. 鉴权接真：Cookie JWT、Pinia、axios 代理、`send-code`/`register`/`login`/`login-code`/`me`/`logout`。
8. 图形验证码改为服务端 `svg-captcha` + Redis；前端 `CaptchaField` 只展示图、提交用户输入。

---

## 11. 下一步（按优先级）

1. 设置页改密码、改邮箱接真 API（发码同样要带图形码 + `purpose: change_email`，若后端已支持）。
2. 家庭成员 / 药品 / 提醒 / 打卡真实 API。**不要改路由。**
3. 上线：Cookie `secure: true`、配好 `FRONTEND_URL`。

---

## 12. 常用命令

```bash
# 前端
cd frontend
npm run dev
npm run build
npm run lint
npm run format

# 后端
cd backend
npm run dev
npm run lint
npm run format
```

PowerShell 不要用 `cd a && npm run b`，用 `cd a; npm run b`。

---

## 13. 关键文件索引

```
carevial/
  AI_CONTEXT.md
  frontend/vite.config.js          ← 代理 /api、alias @
  frontend/src/router/index.js     ← 不要改结构
  frontend/src/stores/user.js
  frontend/src/api/{request,auth}.js
  frontend/src/utils/validate.js
  frontend/src/components/AuthModal.vue
  frontend/src/components/CaptchaField.vue
  frontend/src/components/layout/AppLayout.vue
  frontend/src/components/layout/Sidebar.vue
  frontend/src/assets/main.css
  frontend/src/mocks/
  backend/app.js
  backend/server.js
  backend/routes/index.js
  backend/routes/authRoutes.js
  backend/controllers/authController.js
  backend/models/User.js
  backend/middleware/auth.js
  backend/utils/{validate,emailCode,mail,captcha}.js
  backend/config/{db,redis}.js
```

Agent 对话备份：[Carevial 开发主线](0ab0c5b3-7d02-46d3-ba0b-41246392c493)（Cursor agent-transcripts）。
