# Carevial 项目记忆（给后续 AI）

> 新对话先读本文件再改代码。更新日期：**2026-09-13**。有重大决策时同步更新。  
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
7. **一功能一会话**：做完当前功能后新开对话再开下一块（见 `.cursor/rules/one-feature-per-session.mdc`）。

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

守卫：未 `bootstrapped` 先 `/auth/me`；未登录 → `/` + `?redirect=`。`main.js`：**先 pinia 再 router**。预览站用 `/dashboard` 前缀，Vue 跳转必须带。

---

## 4. 前端模块状态

### 已接真 API

- **鉴权**：HttpOnly Cookie `token`（无 localStorage）。Pinia `stores/user.js`。`AuthModal`（密码/验证码登录；注册要图形码+邮箱码）。`CaptchaField` 服务端出图。校验在 `utils/validate.js`（前后端对齐）。
- **家庭**：`FamilyView` + `/api/family-members`。一套表单 + `editingId`。创建成员事务内插空 `health_profiles`；删成员 CASCADE 档案。有关联药时提示变「家庭公用」（依赖 `medicines.member_id ON DELETE SET NULL`）。
- **健康档案**：`FamilyHealthView` + `/api/health-profiles`。列表 JOIN 一次拿齐；更新用 **`memberId`**。字段均可选。
- **药品（2026-09-09 已完成）**：列表/筛选/添加/编辑/删除/详情；详情可编辑（`?edit=id` 打开列表弹窗）与删除。照片：**FormData 随药品 create/update 上传**（字段名 `file`；清空传 `clearPhoto=1`），不再走独立前端 upload API。本地 FileReader 仅预览。COS：`cosUpload` + `deleteCos`（写库成功删旧图；失败删新图）。展示用 `calcExpiryStatus(expiry_date)` **实时算**；库列 `expiry_status` 可写但不作展示依据（暂无定时刷新）。类型：`otc` / `prescription` / `health`。无库存字段。
- **提醒（2026-09-10 已完成）**：`RemindersView` + `/api/reminders`。**一天一行**；字段名一律 **`days`**（0–6 = JS `getDay()`，0=周日）。创建传 `days` **数组**（事务 `createMany`）；编辑/开关传单个 `days`。无成员字段。列表按所选日筛选，同日内按 `time` 排。药品详情「关联提醒」：`GET /reminders/medicine/:medicineId`，前端按**周一→周日**再按时间排（`(days + 6) % 7`）。表单 `addError`/`editError` + deep `watch` 清空。删药依赖 `reminders.medicine_id ON DELETE CASCADE`。暂无重复（同药+同日+同时）校验、无推送。
- **打卡（2026-09-11 已完成）**：`CheckinView` + `/api/medicine-logs`。横条为**今天 ±3 共 7 个日历日**（不是周一～周日周历）。列表 = 该日周几匹配的提醒（**不过滤 `enabled`**：`enabled` 只表示以后要不要通知）+ 是否已打卡。打卡 `POST`（body：`reminderId`、`logDate`），取消 `DELETE /:id`（用返回的 `logId`）。有行 = 已服、`status='taken'`；无行 = 未打卡。周条进度对 7 天各调一次 `GET ?date=`。`item.checked`（布尔）与汇总 `checkedCount`（数字）勿混名。
- **Dashboard（2026-09-11 已完成）**：`DashboardView` **状态提升**——父组件 `Promise.all` 拉齐 `medicines` / `members` / 今日 `medicine-logs`，子组件只收 props。`StatsCards`（药品数、家人数、今日打卡、即将过期数）、`TodayMedicineTimeline`（按上午/下午/晚上分组；`emit('toggle')` → 父组件 `addLog`/`deleteLog` 再刷新）、`ExpiringAlert`（只筛 `expiryStatus === 'expiring'`，按 `diffDaysFromToday(expiryDate)` 排序；`memberName || '家庭公用'`）；`QuickActions` / `AiBanner` 纯跳转。与打卡页同源云端。日期：`utils/date.js`（dayjs + `zh-cn`：`getTodayDateStr`、`getDateLine`、`getWeekdayLabel`、`diffDaysFromToday`）。已不用 `useMedicineCheckin` / `mocks/dashboard.js`（仓库里若还在可删）。
- **设置（2026-09-13 已完成）**：`SettingsView` + 扩展 `/api/auth`。改用户名 `PATCH /profile`；通知偏好 `PATCH /settings`（`notificationEnabled` / `soundEnabled` / `reminderBeforeMinutes`∈`{0,5,10,15,30}`，存 `users` 表）；改密 `PATCH /password`；改邮 `POST /change-email`（发码 `purpose: change_email` + 图形码，验证码绑**新邮箱**，提交需当前密码；`checkCode` 成功后再 `consumeCode`）；头像 `POST /avatar`（`uploadSingle`，字段名 `file`，COS，写库成功删旧图）。登录与 `/me` 经 `formatUser` 返回 camelCase 含上述字段。Pinia `stores/user.js` 成功后写回 `user`。`UserAvatar`：有 `avatarUrl` 用图，否则用户名首字母；设置页与 `Sidebar` 共用。关通知时前端**只禁用**声音开关，**不**把 `soundEnabled` 改成 false。已去掉：震动、语言/时间格式/每周起始日、清除本地数据；用户协议/隐私政策 UI 保留但未实现。错误约定：表单校验 → 行内 `error`；接口失败 → `ElMessage`。验证码倒计时：`watch(countdown)` + `setTimeout` 链（AuthModal 与设置页统一此写法）。暂无浏览器推送 / `Notification` 权限（偏好先入库，到点提醒以后再接）。

### 仍用 mock / 未接

- AI。

### UI / 其它

- 布局：`AppLayout` + `Sidebar`（头像用 `UserAvatar`）；删除/退出用 `ConfirmModal`。
- 列表加载：`ElSkeleton`；进页即请求的列表/详情页 `loading` 初值倾向 **`true`**（避免闪空态）。
- 表单错误：校验用行内 `error`（多字段表单可用 `watch` 清空）；接口错误用 `ElMessage`（设置页已按此分）。
- 回跳：`utils/navigation.js` → `isSafeInternalPath`。
- 落地页滚动动画：`composables/useInView.js`（仍在用，勿删）。

---

## 5. UI 预览

当前对齐：**13522709**  
https://readdy.cc/preview/d49be038-2eba-450c-bb6c-e42ec62a8b54/13522709/family  
（其它页改路径末尾即可。）曾用 13428042；本地 `tmp-preview-src-*` 仅参考，已 gitignore。

---

## 6. 后端要点

### 挂载 `routes/index.js`

- `GET /health`（探活，非健康档案）
- `/api/auth`、`/api/family-members`、`/api/health-profiles`、`/api/medicines`、`/api/reminders`、`/api/medicine-logs`
- `/api/upload`：**保留**（`POST /image`），药品主路径已不依赖；以后其它模块可能用

CORS：`FRONTEND_URL` + `credentials`。中间件：`middleware/auth.js` → `req.userId`。

### Auth（摘要）

captcha → send-code（先核图形码；`purpose`：`register` / `login` / `change_email`）→ register / login / login-code / me / logout。  
另需登录：`PATCH /profile`、`PATCH /settings`、`PATCH /password`、`POST /change-email`、`POST /avatar`（`uploadSingle`）。  
`GET /me` 与登录返回的 `user`：`formatUser`（含 `avatarUrl`、三个通知偏好）。  
Redis：邮箱码、图形码。JWT Cookie 7 天；开发 `secure: false`。注册成功**不**发 Cookie。

### 药品 API `/api/medicines`（均需登录）

| 方法 | 说明 |
|------|------|
| GET `/`、`GET /:id` | 列表/详情；`photoUrl` 等 camelCase；`expiryStatus` 实时算 |
| POST `/`、PUT `/:id` | `uploadSingle`（multer）；body 文本字段 + 可选 `file` / `clearPhoto` |
| DELETE `/:id` | 删库后删 COS 旧图 |

家庭：`GET /:id/medicine-count` 供删除确认文案。

### 提醒 API `/api/reminders`（均需登录）

| 方法 | 说明 |
|------|------|
| GET `/` | 当前用户全部提醒（JOIN 药名） |
| GET `/medicine/:medicineId` | 某药提醒（须先校验药归属）；路由写在 `/:id` 类路由前 |
| POST `/` | body：`medicineId`、`time`（`HH:mm`）、`days`（数组）、`enabled`；返回新建行数组 |
| PUT `/:id` | body：同上但 `days` 为**单个** 0–6；改药须有权 |
| DELETE `/:id` | 按 id + userId 删 |

响应字段 camelCase：`medicineId`、`medicineName`、`time`、`days`、`enabled` 等。`enabled`：API/前端用 `true`/`false`；库 BOOLEAN→TINYINT。

### 打卡 API `/api/medicine-logs`（均需登录）

| 方法 | 说明 |
|------|------|
| GET `/?date=YYYY-MM-DD` | 该日应服提醒（按 `days===getDay()`，**不过滤 enabled**）合并已打 log；返回 `items`（含 `reminderId`、`checked`、`logId`）、`checkedCount`、`total` |
| POST `/` | body：`reminderId`、`logDate`；`medicineId`/`scheduledTime` 由服务端从提醒抄；校验周几匹配、防重复 |
| DELETE `/:id` | 取消打卡（id + userId） |

响应 camelCase。创建成功目前 body `code: 200`（与现有拦截器一致；以后若统一 201 需改 `request.js` 放行 2xx）。

### 校验（`utils/validate.js`）

用户名/密码/邮箱码；`isIdValid`；年龄；血型；标签数组；药品类型与日期 `isDateValid`（`YYYY-MM-DD`，打卡 `logDate`/query `date` 共用）；档案备注等；提醒：`isTimeValid`、`isDayValid`、`isDaysArrayValid`、`isBooleanValid`；设置：`isReminderBeforeValid`（0/5/10/15/30）。前端同名逻辑对齐（设置页校验用前端 `validate.js`）。

### 已知坑

1. 开发必须 Vite 代理 + `withCredentials`。
2. COS 桶公有读时，个别图可能被**内容审核**事后改成对象 private → 公开 URL 403（非代码漏 ACL）。
3. `expiry_status` 列会过时；展示勿盲信，用实时计算。
4. PowerShell：`cd a; npm run b`（不用 `&&`）。
5. 提醒 `days`：**0=周日**；详情展示「周一优先」排序用 `(days + 6) % 7`，勿与 `ORDER BY days ASC`（周日在前）混淆。
6. MySQL `TIME`：`formatTime` 优先按字符串截 `HH:mm`；若驱动返回 `Date` 需防时区偏移。
7. 打卡归属日用 **`log_date`**，勿用 `DATE(taken_at)`（补打昨天会错）。算周几时用 `新 Date(\`${date}T12:00:00\`)` 减轻时区边界问题。
8. 前端 `request.js` 拦截器目前只认 `body.code === 200`；打卡创建勿单独改 201 除非同步改拦截器。
9. 周条 `loadWeekMap` 须用 `results[i].data`（整包响应还有一层 `data`），勿把 `loadDay` 并行 7 次（会竞态覆盖列表）。
10. MySQL `BOOLEAN` ≡ `TINYINT(1)`；读出偏好后用 `Boolean(...)` 再给前端。头像上传失败/写库失败须 `deleteCosByUrl(newUrl)` 防 COS 垃圾。

---

## 7. 数据表意向

| 表 | 状态 |
|------|------|
| `users` | **已用**；相对 README 增 `avatar_url`、`notification_enabled`、`sound_enabled`、`reminder_before_minutes`（默认开通知/开声音、提前 5 分钟）。可选：`username`/`email`/`password_hash` 宜 `NOT NULL` |
| `family_members` / `health_profiles` | 已用 |
| `medicines` | **已用**（建表见 medicine-reminder README；`member_id` SET NULL） |
| `reminders` | **已用**（一天一行；`days` TINYINT 0–6；`medicine_id` CASCADE） |
| `medicine_logs` | **已用**（相对 README 增 **`log_date DATE NOT NULL`**；`reminder_id` 可空 + `ON DELETE SET NULL`；建议 `UNIQUE(reminder_id, log_date)`；保留 `scheduled_time` 作快照；`taken_at` 为点击时刻。打卡写 `taken`；未打卡 = 无行） |

邮箱码/图形码只进 Redis。不要加回「库存」除非产品要求。参考 README 里 `days` 注释可能仍写逗号串/1–7，**本仓实现以一天一行 + 0–6 为准**。

### 环境变量

见 `backend/.env.example`：`DB_*`、`JWT_SECRET`、`REDIS_URL`、`FRONTEND_URL`、`RESEND_*`、`TENCENT_SECRET_*` / `TENCENT_COS_*`。

---

## 8. 下一步

1. AI 模块；用户协议 / 隐私政策正文（设置页按钮暂空）。
2. 上线：Cookie `secure: true`、配好 `FRONTEND_URL`。
3. 可选：可删无用 `mocks/dashboard.js`、`useMedicineCheckin.js`；提醒重复校验；到点推送 / 浏览器通知（才真正用到提醒 `enabled` 与用户通知偏好）；`expiry_status` 定时刷新或停写该列；打卡按日期范围一次拉取；创建接口统一 201 + 拦截器放行 2xx；药品/用户建表 SQL 收入本仓文档；Dashboard Stats 无安排时显示 `-` 而非 `0/0`。

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
frontend/src/stores/user.js           ← 含 profile/settings/password/email/avatar
frontend/src/api/{request,auth,family,health,medicine,reminder,medicineLog}.js
frontend/src/utils/{validate,date,medicine,navigation}.js
frontend/src/views/{Dashboard,Family,FamilyHealth,Medicines,MedicineAdd,MedicineDetail,Reminders,Checkin,Settings}View.vue
frontend/src/components/home/{StatsCards,TodayMedicineTimeline,ExpiringAlert,QuickActions,AiBanner}.vue
frontend/src/components/layout/{AppLayout,Sidebar}.vue
frontend/src/composables/useInView.js            ← Landing / Feedback 入场；保留
frontend/src/composables/useMedicineCheckin.js   ← 已无引用，可删
frontend/src/components/{AuthModal,CaptchaField,ConfirmModal,UserAvatar}.vue
frontend/src/mocks/dashboard.js                 ← 已无引用，可删
backend/routes/{index,auth,family,health,medicine,reminder,medicineLog,upload}Routes.js
backend/controllers/{auth,family,health,medicine,reminder,medicineLog}Controller.js
backend/models/{User,FamilyMember,HealthProfile,Medicine,Reminder,MedicineLog}.js
backend/middleware/auth.js
backend/utils/{validate,date,upload,cosUpload,deleteCos,tencentCos,emailCode,mail,captcha}.js
backend/config/{db,redis}.js
backend/.env.example
```
