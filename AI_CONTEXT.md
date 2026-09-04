# Carevial 项目记忆（给后续 AI 用）

> **用法**：新对话或上下文被压缩后，先读本文件，再动手改代码。  
> 更新日期：2026-09-04。有重大决策时同步改这里。  
> 对话原文（很大）：`C:\Users\HONOR\.cursor\projects\d-vue-project-carevial\agent-transcripts\0ab0c5b3-7d02-46d3-ba0b-41246392c493\0ab0c5b3-7d02-46d3-ba0b-41246392c493.jsonl`

---

## 1. 项目是什么

Carevial（产品名，不是「药管家」）是 **智能家庭用药管理** 全栈应用。

| 路径 | 作用 |
|------|------|
| `D:\vue-project\carevial` | **本仓库，当前工作区** |
| `D:\vue-project\medicine-reminder` | 用户之前的参考项目。可对照表结构、接口风格。**禁止改它的代码**。 |

用户是开发者本人：后端业务倾向自己写、AI 讲步骤；前端 UI 由 AI 按预览站用 Vue 复刻。回复语言：**简体中文**。用户常说「教我怎么做、不要直接改代码」——除非明确让改，否则只讲解。

---

## 2. 硬性约定（违反会惹用户）

1. **不要改现有页面路由结构**（`frontend/src/router/index.js`）。登录后前缀是 `/dashboard/...`，不是预览站的 `/family`、`/medicines`。
2. **不要改 `medicine-reminder` 仓库。**
3. **不要提交 `.env`**，不要把真实密钥写进文档。`.env` 是真配置；`.env.example` 才是示例。
4. **后端**：CommonJS + **必须有分号**（`backend/.prettierrc.json` 里 `semi: true`）。
5. **前端**：ESM + **无分号**（`frontend/.prettierrc.json` 里 `semi: false`）。
6. 用户明确不要 Docker。本机 Redis：`D:\redis\redis-server.exe`，`redis-cli ping` → PONG。
7. 只在用户要求时 git commit / push。
8. 改登录后 UI 时，对照 **最新** Readdy 预览（见 §6），不要用旧版 `13260973` / `12816190` / 过期的 `13428042`（已被更新版取代时以最新为准）。

---

## 3. 技术栈

### 前端 `carevial/frontend`

- Vue 3 + Vite 8 + **JavaScript**（不是 TypeScript）
- Vue Router 5、Pinia
- axios：`frontend/src/api/request.js`，`baseURL: '/api'`，`withCredentials: true`
- Tailwind CSS **v4**（`@tailwindcss/vite`）
- Remix Icon（`ri-*`）
- Element Plus：**按需**用 `ElMessage`、列表加载用 `ElSkeleton` / `ElSkeletonItem`（家庭成员、健康档案；不要当整站表单皮肤）
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

## 5. 前端现状（2026-09-04）

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
- 本地校验错误：弹窗内一行小字 `error`；**输入字段变化时 `watch` 清空 error**（与家庭成员 / 健康档案表单一致）。
- 接口成功/失败用 `ElMessage`。

### 图形验证码 `CaptchaField.vue`

- **服务端出图**：`GET /auth/captcha` → `{ captchaId, image }`（data URL）。答案只在 Redis。
- 前端不本地对答案。满 4 位 `emit('ready-change', true)` 只表示可点发送。
- `defineExpose({ getPayload })` 给父组件 id + 用户输入。
- `refreshSeq`：连点换图只采纳最后一次请求；拉图失败清空 `captchaId` / `image`。
- 设置页改邮箱仍用该组件，但改邮箱接口 **尚未接**（相关 handler 注释掉了）。

### 布局

- `AppLayout.vue`：侧栏 `collapsed` 在布局；`h-screen overflow-hidden`；展开 `lg:ml-[220px]`，收起 `lg:ml-16`。
- `Sidebar.vue`；确认弹窗统一用 `ConfirmModal.vue`（删除 / 退出登录共用）。**已删除** `LogoutConfirmModal.vue`。
- `AiBanner.vue`：右下角「AI 助手」FAB（Dashboard）。

### 家庭成员（已接真实 API）

- 页面：`FamilyView.vue`；API：`frontend/src/api/family.js` → `/family-members`。
- **一套表单 + 一个弹窗**：`form` + `editingId`（`null` = 添加，有值 = 编辑）；`openAddModal` / `openEditModal` / `closeModal` / `handleSubmit`。
- 本地校验：姓名/关系必填且 ≤50；年龄可选，`isAgeValidIfPresent`（0–120 整数）；错误显示在表单下方一行 `error`；`watch(form)` 输入时清空；**不用** HTML `required`。
- 列表：`loading` → `ElSkeleton`；空列表（白卡片 + `ri-group-line` +「还没有添加家庭成员」）；有数据为成员卡片网格。
- 删除：`ConfirmModal` + `deleting` 防连点。
- **创建成员时后端事务同步插入空 `health_profiles`**；删成员由 FK `ON DELETE CASCADE` 删档案。

### 健康档案（已接真实 API，2026-09-04）

- 页面：`FamilyHealthView.vue`；API：`frontend/src/api/health.js` → `/health-profiles`。
- 列表数据：`GET` 一次返回（成员 JOIN 档案），**不要**前端再调家庭成员接口拼 name/relationship。
- 列表 key / 展开 / 更新均用 **`memberId`**（不是档案 `id`）。
- 所有档案字段可选：血型、过敏史、慢性病、用药禁忌、备注。血型未选：库 `NULL`，下拉 `value=""` 文案「未知」；列表标题行目前有血型才显示。
- 编辑弹窗：标签可增删；备注框内右下角实时计数 `notesLength/1000`（超限变红）；**不用** textarea `maxlength`（避免浏览器原生提示）。
- 前端校验对齐后端：标签最多 20 条、每条 ≤50；备注 ≤1000；表单下方 `error`；`watch(editForm + 三个 newXxx)` 输入时清空。
- 加载：竖排卡片骨架（padding 对齐真卡 + 内容区约 40px）；无成员时空状态链到 `/dashboard/family`。

### 其他登录后页面

药品 / 提醒 / 打卡 / Dashboard 等 **仍多用** `frontend/src/mocks/`。不要误以为全家都已接 API。

### 登录回跳

`frontend/src/utils/navigation.js` → `isSafeInternalPath`

---

## 6. UI 对照（Readdy 预览）

**当前应对齐的版本（13522709，家庭空状态等已按此对照）：**

- 家庭成员：https://readdy.cc/preview/d49be038-2eba-450c-bb6c-e42ec62a8b54/13522709/family
- 同版本其它页：把路径末尾换成 `dashboard`、`medicines`、`family` 相关等

更早对齐过 **13428042**（时间线、年龄展示、「家庭公用」文案等）。旧版 `13260973`、`12816190` 不要再用。

本地可从 source map 抽出 React 源码到 `tmp-preview-src-*/`（参考用，**不是产品代码**）。根 `.gitignore` 忽略 `tmp-preview-src*`。预览是 React；本项目用 Vue + Tailwind 复刻结构/class。落地页/登录注册可单独定版，**登录后页面以最新预览为准**。

---

## 7. 后端鉴权（已落地）

### 路由挂载

`backend/routes/index.js`：

- `GET /health`（服务探活，**不是**健康档案业务）
- `app.use('/api/auth', authRoutes)`
- `app.use('/api/family-members', familyRoutes)`（整组需登录）
- `app.use('/api/health-profiles', healthRoutes)`（整组需登录）

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

### 校验 `backend/utils/validate.js`（及前端同名逻辑）

- 用户名：trim 后 1–10
- 密码：6–12，必须同时有大小写字母和数字
- 邮箱验证码：6 位数字
- `isAgeValidIfPresent`：空则通过；有值须 0–120 整数
- `isIdValid`：路径参数正整数（`^\d+$` 且 `> 0`）
- `isBloodTypeValidIfPresent`：空通过；有值须 `A型|B型|AB型|O型`
- `isStringArrayValid`：数组，最多 20 项，每项非空字符串 ≤50
- `isMedicalNotesValidIfPresent`：空通过；有值 trim 后 ≤1000

### Redis

- 邮箱码：`email_code:{purpose}:{email}`，TTL 300s；冷却 `email_code_send:{purpose}:{email}`，60s
- `checkCode` / `consumeCode` / `verifyCode`：注册先 check 再 create 再 consume；登录用 verify（成功即删）
- 图形码：`captcha:{uuid}`，存小写答案，TTL 300s。`verifyCaptcha` **对错都 del**（一次一码）

### 邮件

Resend。`EMAIL_FROM`、`RESEND_API_KEY`。`from` 建议 `Carevial <notify@域名>`，否则 QQ 显示名可能只是 `notify`。

### JWT / Cookie

`jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })`。Cookie 名 `token`：`httpOnly`，开发 `secure: false`，`sameSite: 'lax'`，`path: '/'`，7 天。JSON **不返回 token**。中间件读 `req.cookies.token` → `req.userId`。上线再开 `secure: true`。

### 用户模型 `models/User.js`

- `create({ username, email, password })` → insertId，**bcryptjs** 写入 `password_hash`
- `findByEmail`、`findById`；表字段 **`username`**，不是 `name`

### 已知坑

1. 开发必须走 Vite 代理 + `withCredentials`，不要前端 `baseURL` 直连 `:3000`。
2. 注册成功不发 JWT，必须再登录才能进 dashboard（当前产品如此）。
3. 设置页改密码、改邮箱 **未接 API**。
4. `GET /captcha` 未做 IP 限流。
5. `server.js` 里有从 medicine-reminder 抄来的过期任务 / WebSocket 注释，Carevial 还没做。
6. 鉴权中间件路径是 `backend/middleware/auth.js`（**不是** `middlewares/authMiddleware`）。
7. 测家庭/档案接口改代码后若行为像旧版，确认 `node --watch` 已重载；非法 id 应 400，不应进 SQL 变 500。

---

## 8. 家庭成员 API（已落地）

### 路由 `backend/routes/familyRoutes.js`

全部挂 `authMiddleware`。前缀：`/api/family-members`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 当前用户成员列表 |
| POST | `/` | 新增（事务内同步建空健康档案） |
| PUT | `/:id` | 更新（先 `isIdValid`，再 body） |
| DELETE | `/:id` | 删除（先 `isIdValid`；档案 FK CASCADE） |

非法 id → 400「无效的家庭成员ID」；不存在或非本人 → 404。

### Controller / Model

- `controllers/familyController.js`：`parseMemberBody`（姓名/关系非空 ≤50；年龄可选 0–120）；`req.userId` 作用域隔离。
- `models/FamilyMember.js`：`create` 用连接事务：`INSERT family_members` → `HealthProfile.create` → commit；失败 rollback。
- 年龄用 `age == null ? null : age`（保留 `0`）。

表：`family_members`（`user_id, name, age, relationship, created_at, updated_at` 等；时间为 `DATETIME`）。

---

## 9. 健康档案 API（已落地）

### 表 `health_profiles`

- `user_id`、`member_id`（UNIQUE，FK → `family_members`，`ON DELETE CASCADE`）
- `blood_type` 可空；`allergies` / `chronic_conditions` / `contraindications` 为 **JSON** 数组；`medical_notes` VARCHAR(1000) 可空
- `created_at` / `updated_at`：`DATETIME`

字段命名与药品表一致用 **`member_id`**（不是 `family_member_id`）。

### 路由 `backend/routes/healthRoutes.js`

前缀：`/api/health-profiles`，全部需登录。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 当前用户：`family_members` LEFT JOIN `health_profiles`，格式化为前端 camelCase |
| PUT | `/:memberId` | 按**成员 id** 更新档案（先 `isIdValid`）；不存在 → 404 |

### Controller / Model

- `controllers/healthController.js`：`parseProfileBody`（接收 camelCase；血型空 → `NULL`；数组 normalize）；写库用 snake_case。
- `models/HealthProfile.js`：`create`（空档）、`findByUser`（join + `formatProfileRow` / `parseJsonArray`）、`update(memberId, userId, data)`（`JSON.stringify` 写数组列）。

一人一档；列表以成员为准。旧成员若缺档案需 SQL 补齐（创建流程已保证新成员有档）。

---

## 10. 环境变量（backend）

见 `backend/.env.example`：`PORT`、`DB_*`、`JWT_SECRET`、`RESEND_API_KEY`、`EMAIL_FROM`、`REDIS_URL`、**`FRONTEND_URL`**（CORS）。  
腾讯云 COS 占位（药品照片以后可能用），鉴权没用 COS。

---

## 11. 数据设计意向

| 表 | Carevial 状态 |
|------|----------------|
| `users` | 已用 |
| `family_members` | **已用** |
| `health_profiles` | **已用** |
| `medicines` / `reminders` / `medicine_logs` | 尚未接 API；仍可参考 medicine-reminder README |

邮箱码、图形码都不进 MySQL，只进 Redis。

药品「库存」已从预览 UI 去掉，不要加回表单，除非产品再要求。

表时间字段倾向 `DATETIME` + `updated_at`（与当前 README 建表一致）。

---

## 12. 开发时间线（压缩）

1. Vue 复刻 Readdy 落地页 + Logo。
2. Express 骨架、MySQL/Redis；用户写 User / mail / emailCode / validate / auth。
3. 前端登录后全页（mock），路由 `/dashboard` 前缀。
4. Prettier + ESLint：前端无分号，后端有分号。
5. Redis 用本机 `D:\redis`，不用 Docker。
6. UI 对齐预览（历经 13260973 → 13428042 → 部分 13522709）。
7. 鉴权接真：Cookie JWT、Pinia、axios 代理、图形验证码 `svg-captcha`。
8. **家庭成员全栈 CRUD**（校验、合并弹窗、空状态、骨架、id 校验；创建同步空档案）。
9. **健康档案全栈**（表 `health_profiles`、JOIN 列表、按 memberId 更新、前端校验/字数计数/骨架）。

---

## 13. 下一步（按优先级）

1. 设置页改密码、改邮箱接真 API（发码同样要带图形码 + `purpose: change_email`，若后端已支持）。
2. 药品 / 提醒 / 打卡真实 API（家庭成员、健康档案已完成）。**不要改路由。**
3. 上线：Cookie `secure: true`、配好 `FRONTEND_URL`。
4. 可选打磨：二次加载不闪骨架；列表 SQL 勿 `SELECT *`；备注 textarea 加 `pb-8` 防与字数重叠等。

---

## 14. 常用命令

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

## 15. 关键文件索引

```
carevial/
  AI_CONTEXT.md
  frontend/vite.config.js          ← 代理 /api、alias @
  frontend/src/router/index.js     ← 不要改结构
  frontend/src/stores/user.js
  frontend/src/api/{request,auth,family,health}.js
  frontend/src/utils/validate.js   ← 含年龄/标签数组/备注等
  frontend/src/views/FamilyView.vue
  frontend/src/views/FamilyHealthView.vue
  frontend/src/components/AuthModal.vue
  frontend/src/components/CaptchaField.vue
  frontend/src/components/ConfirmModal.vue
  frontend/src/components/layout/AppLayout.vue
  frontend/src/components/layout/Sidebar.vue
  frontend/src/assets/main.css
  frontend/src/mocks/              ← 药品/提醒/打卡/Dashboard 等仍用
  backend/app.js
  backend/server.js
  backend/routes/index.js          ← auth + family-members + health-profiles + /health
  backend/routes/authRoutes.js
  backend/routes/familyRoutes.js
  backend/routes/healthRoutes.js
  backend/controllers/authController.js
  backend/controllers/familyController.js
  backend/controllers/healthController.js
  backend/models/User.js
  backend/models/FamilyMember.js
  backend/models/HealthProfile.js
  backend/middleware/auth.js
  backend/utils/{validate,emailCode,mail,captcha}.js
  backend/config/{db,redis}.js
```

Agent 对话备份：[Carevial 开发主线](0ab0c5b3-7d02-46d3-ba0b-41246392c493)（Cursor agent-transcripts）。
