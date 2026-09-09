# Carevial 项目记忆（给后续 AI）

> 新对话先读本文件再改代码。更新日期：**2026-09-09**。有重大决策时同步更新。  
> 对话备份：[Carevial 开发主线](0ab0c5b3-7d02-46d3-ba0b-41246392c493)（agent-transcripts）。

---

## 1. 项目与协作

| 路径 | 作用 |
|------|------|
| `D:\vue-project\carevial` | **本仓库** |
| `D:\vue-project\medicine-reminder` | 参考项目（表结构/接口）。**禁止改它的代码** |

- 产品名 **Carevial**（不是「药管家」）：智能家庭用药管理全栈应用。
- 用户：后端倾向自己写、AI **讲步骤**；前端 UI 按预览用 Vue 复刻。语言：**简体中文**。说「教我/不要直接改」→ 只讲不改，除非明确让改。

### 硬性约定

1. **不改** `frontend/src/router/index.js` 路由结构（登录后前缀 `/dashboard/...`）。
2. **不改** medicine-reminder；**不提交** `.env` / 真实密钥。
3. 后端 CommonJS + **分号**；前端 ESM + **无分号**。
4. 不要 Docker。本机 Redis：`D:\redis\redis-server.exe`。
5. 只在用户要求时 commit / push。
6. 登录后 UI 对齐最新 Readdy 预览（§5）；旧版 `13260973` / `12816190` 勿用。

---

## 2. 技术栈与本地

**前端**：Vue 3 + Vite 8 + JS、Router 5、Pinia、axios（`baseURL: '/api'`，`withCredentials`）、Tailwind v4、Remix Icon、Element Plus（按需：`ElMessage` / `ElSkeleton`，不当整站表单皮）、主题在 `assets/main.css`。代理 `/api` → `:3000`（**勿**让浏览器直连 3000 调鉴权）。

**后端**：Express 5 + CommonJS；mysql2、ioredis、JWT、bcryptjs、resend、cookie-parser、svg-captcha、multer、sharp、cos-nodejs-sdk-v5。入口 `server.js` → `app.js` → `routes/index.js`。

- 前端常见 `http://localhost:5173`；后端 `:3000`。

---

## 3. 前端路由（勿改结构）

公开：`/` Landing（登录注册弹窗）、`/feedback`。

登录后（`AppLayout` + `requiresAuth`）：

| path | 视图 |
|------|------|
| `/dashboard` | DashboardView |
| `/dashboard/family` | FamilyView |
| `/dashboard/family-health` | FamilyHealthView |
| `/dashboard/medicines` | MedicinesView |
| `/dashboard/medicines/add` | MedicineAddView |
| `/dashboard/medicines/:id` | MedicineDetailView |
| `/dashboard/reminders` | RemindersView |
| `/dashboard/checkin` | CheckinView |
| `/dashboard/ai` | AiView |
| `/dashboard/settings` | SettingsView |

守卫：未 `bootstrapped` 先 `/auth/me`；未登录 → `/` + `?redirect=`。`main.js`：**先 pinia 再 router**。预览站无 `/dashboard` 前缀，Vue 跳转必须带。

---

## 4. 前端模块状态

### 已接真 API

- **鉴权**：HttpOnly Cookie `token`（无 localStorage）。Pinia `stores/user.js`。`AuthModal`（密码/验证码登录；注册要图形码+邮箱码）。`CaptchaField` 服务端出图。校验在 `utils/validate.js`（前后端对齐）。
- **家庭**：`FamilyView` + `/api/family-members`。一套表单 + `editingId`。创建成员事务内插空 `health_profiles`；删成员 CASCADE 档案。有关联药时提示变「家庭公用」（依赖 `medicines.member_id ON DELETE SET NULL`）。
- **健康档案**：`FamilyHealthView` + `/api/health-profiles`。列表 JOIN 一次拿齐；更新用 **`memberId`**。字段均可选。
- **药品（2026-09-09 已完成）**：列表/筛选/添加/编辑/删除/详情；详情可编辑（`?edit=id` 打开列表弹窗）与删除。照片：**FormData 随药品 create/update 上传**（字段名 `file`；清空传 `clearPhoto=1`），不再走独立前端 upload API。本地 FileReader 仅预览。COS：`cosUpload` + `deleteCos`（写库成功删旧图；失败删新图）。展示用 `calcExpiryStatus(expiry_date)` **实时算**；库列 `expiry_status` 可写但不作展示依据（暂无定时刷新）。类型：`otc` / `prescription` / `health`。无库存字段。

### 仍用 mock / 未接

- Dashboard、提醒、打卡、AI、设置改密/改邮；详情「关联提醒」仍挂 mock，等提醒模块。
- `frontend/src/mocks/` 仍服务上述页面。

### UI / 其它

- 布局：`AppLayout` + `Sidebar`；删除/退出用 `ConfirmModal`。
- 列表加载：`ElSkeleton`；表单错误一行 `error` + `watch` 清空。
- 回跳：`utils/navigation.js` → `isSafeInternalPath`。

---

## 5. UI 预览

当前对齐：**13522709**  
https://readdy.cc/preview/d49be038-2eba-450c-bb6c-e42ec62a8b54/13522709/family  
（其它页改路径末尾即可。）曾用 13428042；本地 `tmp-preview-src-*` 仅参考，已 gitignore。

---

## 6. 后端要点

### 挂载 `routes/index.js`

- `GET /health`（探活，非健康档案）
- `/api/auth`、`/api/family-members`、`/api/health-profiles`、`/api/medicines`
- `/api/upload`：**保留**（`POST /image`），药品主路径已不依赖；以后其它模块可能用

CORS：`FRONTEND_URL` + `credentials`。中间件：`middleware/auth.js` → `req.userId`。

### Auth（摘要）

captcha → send-code（先核图形码）→ register / login / login-code / me / logout。  
Redis：邮箱码、图形码。JWT Cookie 7 天；开发 `secure: false`。注册成功**不**发 Cookie。

### 药品 API `/api/medicines`（均需登录）

| 方法 | 说明 |
|------|------|
| GET `/`、`GET /:id` | 列表/详情；`photoUrl` 等 camelCase；`expiryStatus` 实时算 |
| POST `/`、PUT `/:id` | `uploadSingle`（multer）；body 文本字段 + 可选 `file` / `clearPhoto` |
| DELETE `/:id` | 删库后删 COS 旧图 |

家庭：`GET /:id/medicine-count` 供删除确认文案。

### 校验（`utils/validate.js`）

用户名/密码/邮箱码；`isIdValid`；年龄；血型；标签数组；药品类型与有效期 `YYYY-MM-DD`；档案备注等。前端同名逻辑对齐。

### 已知坑

1. 开发必须 Vite 代理 + `withCredentials`。
2. COS 桶公有读时，个别图可能被**内容审核**事后改成对象 private → 公开 URL 403（非代码漏 ACL）。
3. `expiry_status` 列会过时；展示勿盲信，用实时计算。
4. 设置页改密/改邮未接。
5. PowerShell：`cd a; npm run b`（不用 `&&`）。

---

## 7. 数据表意向

| 表 | 状态 |
|------|------|
| `users` / `family_members` / `health_profiles` | 已用 |
| `medicines` | **已用**（建表见 medicine-reminder README；`member_id` SET NULL） |
| `reminders` / `medicine_logs` | 未接 |

邮箱码/图形码只进 Redis。不要加回「库存」除非产品要求。

### 环境变量

见 `backend/.env.example`：`DB_*`、`JWT_SECRET`、`REDIS_URL`、`FRONTEND_URL`、`RESEND_*`、`TENCENT_SECRET_*` / `TENCENT_COS_*`。

---

## 8. 下一步

1. 提醒 / 打卡 / Dashboard 真实 API（**勿改路由**）。
2. 设置页改密、改邮（`purpose: change_email` + 图形码）。
3. 上线：Cookie `secure: true`、配好 `FRONTEND_URL`。
4. 可选：`expiry_status` 定时刷新或停写该列；药品建表 SQL 收入本仓文档。

---

## 9. 常用命令

```bash
cd frontend; npm run dev    # build / lint / format
cd backend;  npm run dev    # lint / format
```

---

## 10. 关键路径

```
AI_CONTEXT.md
frontend/vite.config.js
frontend/src/router/index.js          ← 勿改结构
frontend/src/stores/user.js
frontend/src/api/{request,auth,family,health,medicine}.js
frontend/src/utils/{validate,date,medicine,navigation}.js
frontend/src/views/{Family,FamilyHealth,Medicines,MedicineAdd,MedicineDetail}View.vue
frontend/src/components/{AuthModal,CaptchaField,ConfirmModal}.vue
frontend/src/mocks/                   ← 提醒/打卡/Dashboard 等
backend/routes/{index,auth,family,health,medicine,upload}Routes.js
backend/controllers/{auth,family,health,medicine}Controller.js
backend/models/{User,FamilyMember,HealthProfile,Medicine}.js
backend/middleware/auth.js
backend/utils/{validate,date,upload,cosUpload,deleteCos,tencentCos,emailCode,mail,captcha}.js
backend/config/{db,redis}.js
backend/.env.example
```
