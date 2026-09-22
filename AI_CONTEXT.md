# Carevial 项目记忆（给后续 AI）

> 新对话先读本文件再改代码。更新日期：**2026-09-22**。有重大决策时同步更新。  
> 对话备份：[Carevial 开发主线](0ab0c5b3-7d02-46d3-ba0b-41246392c493)；AI 助手会话：[AI 流式与工具](55162c78-2c0f-45d5-a2c1-2eff3b37f7de)；医疗 RAG：[RAG 与评测](444cfceb-ed4b-4739-928b-ec4b4efe60dc)（agent-transcripts）。

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
- **药品（2026-09-09 已完成）**：列表/筛选/添加/编辑/删除/详情；详情可编辑（`?edit=id` 打开列表弹窗）与删除。照片：**FormData 随药品 create/update 上传**（字段名 `file`；清空传 `clearPhoto=1`），不再走独立前端 upload API。本地 FileReader 仅预览。COS：`cosUpload` + `deleteCos`（写库成功删旧图；失败删新图）。展示用 `calcExpiryStatus(expiry_date)` **实时算**；库列 `expiry_status` 可写但不作展示依据（暂无定时刷新）。类型：`otc` / `prescription` / `healthcare`（以 `validate.isMedicineTypeValid` 为准，勿写 `health`）。无库存字段。
- **提醒（2026-09-10 已完成）**：`RemindersView` + `/api/reminders`。**一天一行**；字段名一律 **`days`**（0–6 = JS `getDay()`，0=周日）。创建传 `days` **数组**（事务 `createMany`）；编辑/开关传单个 `days`。无成员字段。列表按所选日筛选，同日内按 `time` 排。药品详情「关联提醒」：`GET /reminders/medicine/:medicineId`，前端按**周一→周日**再按时间排（`(days + 6) % 7`）。表单 `addError`/`editError` + deep `watch` 清空。删药依赖 `reminders.medicine_id ON DELETE CASCADE`。暂无重复（同药+同日+同时）校验、无推送。
- **打卡（2026-09-11 已完成）**：`CheckinView` + `/api/medicine-logs`。横条为**今天 ±3 共 7 个日历日**（不是周一～周日周历）。列表 = 该日周几匹配的提醒（**不过滤 `enabled`**：`enabled` 只表示以后要不要通知）+ 是否已打卡。打卡 `POST`（body：`reminderId`、`logDate`），取消 `DELETE /:id`（用返回的 `logId`）。有行 = 已服、`status='taken'`；无行 = 未打卡。周条进度对 7 天各调一次 `GET ?date=`。`item.checked`（布尔）与汇总 `checkedCount`（数字）勿混名。
- **Dashboard（2026-09-11 已完成）**：`DashboardView` **状态提升**——父组件 `Promise.all` 拉齐 `medicines` / `members` / 今日 `medicine-logs`，子组件只收 props。`StatsCards`（药品数、家人数、今日打卡、即将过期数）、`TodayMedicineTimeline`（按上午/下午/晚上分组；`emit('toggle')` → 父组件 `addLog`/`deleteLog` 再刷新）、`ExpiringAlert`（只筛 `expiryStatus === 'expiring'`，按 `diffDaysFromToday(expiryDate)` 排序；`memberName || '家庭公用'`）；`QuickActions` / `AiBanner` 纯跳转。与打卡页同源云端。日期：`utils/date.js`（dayjs + `zh-cn`：`getTodayDateStr`、`getDateLine`、`getWeekdayLabel`、`diffDaysFromToday`）。已不用 `useMedicineCheckin` / `mocks/dashboard.js`（仓库里若还在可删）。
- **设置（2026-09-13 已完成）**：`SettingsView` + 扩展 `/api/auth`。改用户名 `PATCH /profile`；通知偏好 `PATCH /settings`（`notificationEnabled` / `soundEnabled` / `reminderBeforeMinutes`∈`{0,5,10,15,30}`，存 `users` 表）；改密 `PATCH /password`；改邮 `POST /change-email`（发码 `purpose: change_email` + 图形码，验证码绑**新邮箱**，提交需当前密码；`checkCode` 成功后再 `consumeCode`）；头像 `POST /avatar`（`uploadSingle`，字段名 `file`，COS，写库成功删旧图）。登录与 `/me` 经 `formatUser` 返回 camelCase 含上述字段。Pinia `stores/user.js` 成功后写回 `user`。`UserAvatar`：有 `avatarUrl` 用图，否则用户名首字母；设置页与 `Sidebar` 共用。关通知时前端**只禁用**声音开关，**不**把 `soundEnabled` 改成 false。已去掉：震动、语言/时间格式/每周起始日、清除本地数据；用户协议/隐私政策 UI 保留但未实现。错误约定：表单校验 → 行内 `error`；接口失败 → `ElMessage`。验证码倒计时：`watch(countdown)` + `setTimeout` 链（AuthModal 与设置页统一此写法）。暂无浏览器推送 / `Notification` 权限（偏好先入库，到点提醒以后再接）。
- **AI 助手（2026-09-22 · CRUD + 用药安全 + 医疗 RAG 已齐）**：`AiView` + `/api/ai`。模型 **DeepSeek**（`deepseek-flash`，axios 调官方 API，**不**换 Python）。**已完成**：流式 SSE + Markdown（`marked` + `dompurify`，`.ai-md`；链接 `target=_blank`）；Function calling **注册表模式**；确认卡通用 `fields`；取消仅前端改 `actionStatus`，**不**回传模型。前端流式用 **`fetch` 读 body**（勿走 axios）；历史只传 `role`+`content`（可去开场白、滤空）。**聊天记录不落库**：仅前端内存 + 请求短窗携带；刷新即失。旧 `POST /chat` **已删**，仅 `/chat-stream` + `/confirm`。

  **工具架构**：`backend/services/aiTools/`（`index.js` 注册表）。域文件：`family.js` / `health.js` / `medicines.js` / `reminders.js` / `checkin.js` / **`rag.js`**。每个工具：`name`、`kind`（`read`|`write`）、`definition`、读有 `run`、写有 `failHint` + `buildPending` + `execute`。`index` 对外：`TOOL_DEFINITIONS`、`isWriteTool`、`runReadTool`、`buildPending`、`executeConfirmedAction`、`getFailHint`。

  **已有工具**：
  | 域 | 读 | 写（均 pending → confirm） |
  |----|----|---------------------------|
  | 家庭 | `list_family_members` | `create_family_member`、`update_family_member`（无删） |
  | 档案 | `list_health_profiles` | `update_health_profile`（无独立创建/删除；加人时已建空档案） |
  | 药品 | `list_medicines` | `create_medicine`、`update_medicine`（**无照片**；`touchPhoto: false`；无删） |
  | 提醒 | `list_reminders` | `create_reminder`（`days` 数组→多行）、`update_reminder`（`days` 单个）、`delete_reminder` |
  | 打卡 | `list_day_checkins` | `add_checkin`、`cancel_checkin`（须 `logId`+`logDate`；`logDate`≡list 的 `date`） |
  | RAG | `search_medical_knowledge` | （无写） |

  **约定**：写操作不直接落库 → `pendingAction` → `POST /confirm`；一次 SSE 成功写工具只出**一张**确认卡；提醒不关联成员；可选字段清空用 `args.x === undefined`。`SYSTEM_PROMPT` 含工具、边界、用药安全、**RAG 引用/免责声明**。`MAX_TOOL_ROUNDS = 5`。读工具若伴随英文旁白：SSE 发 `content_reset`，前端清空该条助手气泡再继续 `delta`。

  **用药安全（靠 prompt + `list_health_profiles`，未改库）**：能否服药 / 为成员加药 / 为某人相关药设提醒前须先查档案。过敏/禁忌 → 警告且暂不调写工具；慎用 → 说明后仍可出确认卡；无记录可写并声明「档案无记载≠安全」。

  **医疗 RAG（2026-09-22）**：Agentic RAG——用药/病痛/护理等必调 `search_medical_knowledge`；CRUD 打卡等不必。向量库 **Chroma**（本机 Python `chroma run`，默认 `localhost:8000`，集合名 `CHROMA_COLLECTION` 默认 `carevial_medical`）。嵌入 **SiliconFlow 兼容** `EMBEDDING_*`（如 BAAI/bge-m3）。语料：① `backend/data/medical-kb/topics/*.json` 中文主题卡（整卡一块）；② openFDA `drug/label.json` 种子药（`ingestMedicalKb.js` 内 `OPENFDA_SEED_DRUGS`，按 section 切块，**按句装箱**约 700 字、重叠 1 句）。灌库：`node data/scripts/ingestMedicalKb.js`（会删旧集合全量重灌；药与药之间 sleep 防限流）。检索：`services/medicalRag.js`——向量 topN → `RAG_MAX_DISTANCE`（约 **0.82**）过滤；问句命中药名别名时对同药 `drugNames` 文档用 `RAG_DRUG_MAX_DISTANCE`（约 **1.0**）救援。返回 `hits` + `allowedCites` / `allowedSourceUrls` / `citeHint`；无 hits 走「未收录」hint。openFDA ≠ 中国说明书，prompt 要求注明。

  **RAG 评测**：`data/medical-kb/eval/golden.json`（正例带人工 `relevantIds`；负例 `expect: miss`）+ `node data/scripts/evalRaggolden.js` → 平均 **Recall@k** 与误召回率。探针距离：`node data/scripts/probeRagDistance.js`。小集上曾测得 Recall@5≈100%、误召回 0%（样本少，勿外推生产全量）。`relevantIds` = 人工「能直接支撑答题」的文档 id（中文卡用 JSON 的 `id`；openFDA 为 `openfda_{generic}_{section}_{idx}`），**不是**检索 top5 照抄。

  **AI 页 UI**：`AppLayout` 在 `/dashboard/ai` 时 `main` 为 `overflow-hidden p-0`（避免双滚动条）；`AiView` 定高 flex：上消息 `overflow-y-auto`、下输入钉底。其它页 `main` 仍 `overflow-y-auto` + padding。

  **前端确认卡与正文**：`pending` 时**保留**已流式 `content`（`+= '\n\n' + reply`）；禁止 `content = reply` 覆盖。

  **未做 / 下一会话**：AI 会话持久化（MySQL `ai_conversations` / `ai_messages`，非 Chroma）；可选 `list_expiring_medicines` / 今日摘要；浏览器推送；RAG 进阶（意图限 section、药表外置 JSON、按需拉 openFDA、引用服务端硬校验）。不做：AI 删药/删成员、改密换邮头像。知识库**不必**为 chunk 上 MySQL（向量继续 Chroma）。

### 仍用 mock / 未接

- （无；AI 已接真 API，其余业务模块已接。）

### UI / 其它

- 布局：`AppLayout` + `Sidebar`（头像用 `UserAvatar`）；删除/退出用 `ConfirmModal`。AI 页见上（`isAiPage` → main 不滚）。
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
- `/api/auth`、`/api/family-members`、`/api/health-profiles`、`/api/medicines`、`/api/reminders`、`/api/medicine-logs`、`/api/ai`
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

### AI API `/api/ai`（均需登录）

| 方法 | 说明 |
|------|------|
| `POST /chat-stream` | **主路径**。SSE：`delta` / `status` / `content_reset` / `pending` / `done` / `error`。Agent 最多 **5** 轮工具；每轮 `deepseek.chatStream`。读工具当场执行并 `role:tool` 回填；写工具 `buildPending` 成功则发 `pending` 后 `end`；校验失败则 tool 回填 `{ok:false,error,hint}` 继续下一轮 |
| `POST /confirm` | body：`pendingAction`；`isWriteTool(type)` → 再 `buildPending` → `executeConfirmedAction` |

工具：`services/aiTools/`（含 `rag.js`）。DeepSeek：`services/deepseek.js`。RAG：`services/medicalRag.js`、`services/embeddings.js`。断流 **`res.on('close')`**；`Cache-Control`：`no-cache, no-transform`。

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
11. AI SSE：浏览器用 `fetch` + `ReadableStream`，勿用 axios；客户端断开看 `res.on('close')`。写操作必须二次确认；药名/成员名以 DB 为准。打卡归属日 `log_date`≠`taken_at`；取消打卡参数 `logDate` 与 list 的 `date` 同义。Update 合并：可清空字段用 `=== undefined`，勿用 `isNotEmpty(args.x)` 判断「是否传了」（否则无法清空）。`create_reminder` 的 `days` 为数组；`update_reminder` 的 `days` 为单个 0–6（`days=0` 周日时 `isNotEmpty(0)` 为 true，可用）。
12. AI `pending`：`AiView.onPending` 勿用 `reply` 覆盖已有流式正文；追加换行是 `'\n\n'` 不是 `'/n/n'`。用药安全靠模型自觉调 `list_health_profiles`（非服务端强制）。`MAX_TOOL_ROUNDS` 现为 **5**。
13. RAG：Win 上 Chroma 用 Python 服务（勿指望仅 ARM 的 npx 二进制）。**重灌库会 `deleteCollection`**，后端进程内 `cachedCollection` 会指到旧集合 → 检索报错或「未收录」；灌完须**重启后端**。阈值勿为单题乱抬：`0.82` 挡假命中，中文问 openFDA 靠药名救援（`RAG_DRUG_MAX_DISTANCE`）。只写 `border-t` 不写颜色会变黑线。AI 页勿让 `main` 与消息区双滚动。

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

见 `backend/.env.example`：`DB_*`、`JWT_SECRET`、`REDIS_URL`、`FRONTEND_URL`、`RESEND_*`、`TENCENT_*`、`DEEPSEEK_*`、**`CHROMA_*` / `EMBEDDING_*` / `OPENFDA_API_KEY` / `RAG_MAX_DISTANCE` / `RAG_DRUG_MAX_DISTANCE`**。**勿把真实 Key 写入文档或提交 `.env`。**

---

## 8. 下一步

1. **AI（CRUD + 用药安全 + RAG MVP 已齐）**：下一会话可选——**聊天记录 MySQL 持久化**；只读 `list_expiring_medicines` / 今日摘要；浏览器推送；RAG 增强（意图限 section、药表 JSON 外置、按需拉 openFDA）。不做：AI 删药/删成员、改密换邮头像；勿为 chunk 上 MySQL。
2. 用户协议 / 隐私政策正文（设置页按钮暂空）。
3. 上线：Cookie `secure: true`、配好 `FRONTEND_URL`。
4. 可选：可删无用 `mocks/dashboard.js`、`useMedicineCheckin.js`；提醒重复校验；到点推送；`expiry_status` 定时刷新或停写该列；打卡按日期范围一次拉取；创建接口统一 201 + 拦截器放行 2xx；建表 SQL 收入本仓文档。

---

## 9. 常用命令

```bash
cd frontend; npm run dev    # build / lint / format
cd backend;  npm run dev    # lint / format
# RAG（Chroma 须已在 8000）
cd backend; node data/scripts/ingestMedicalKb.js
cd backend; node data/scripts/evalRaggolden.js
cd backend; node data/scripts/probeRagDistance.js
```

---

## 10. 关键路径

```
AI_CONTEXT.md
frontend/vite.config.js
frontend/src/router/index.js          ← 勿改结构
frontend/src/stores/user.js           ← 含 profile/settings/password/email/avatar
frontend/src/api/{request,auth,family,health,medicine,reminder,medicineLog,ai}.js
frontend/src/utils/{validate,date,medicine,navigation,markdown}.js
frontend/src/views/{Dashboard,Family,FamilyHealth,Medicines,MedicineAdd,MedicineDetail,Reminders,Checkin,Ai,Settings}View.vue
frontend/src/components/home/{StatsCards,TodayMedicineTimeline,ExpiringAlert,QuickActions,AiBanner}.vue
frontend/src/components/layout/{AppLayout,Sidebar}.vue
frontend/src/composables/useInView.js            ← Landing / Feedback 入场；保留
frontend/src/composables/useMedicineCheckin.js   ← 已无引用，可删
frontend/src/components/{AuthModal,CaptchaField,ConfirmModal,UserAvatar}.vue
frontend/src/mocks/dashboard.js                 ← 已无引用，可删
backend/routes/{index,auth,family,health,medicine,reminder,medicineLog,upload,ai}Routes.js
backend/controllers/{auth,family,health,medicine,reminder,medicineLog,ai}Controller.js
backend/services/deepseek.js                    ← SYSTEM_PROMPT + chatStream；勿提交真实 API Key
backend/services/{medicalRag,embeddings}.js     ← RAG 检索 / 嵌入
backend/services/aiTools/{index,family,health,medicines,reminders,checkin,rag}.js
backend/data/medical-kb/topics/*.json           ← 中文主题卡
backend/data/medical-kb/eval/golden.json        ← RAG 黄金集（relevantIds）
backend/data/scripts/{ingestMedicalKb,evalRaggolden,probeRagDistance}.js
backend/models/{User,FamilyMember,HealthProfile,Medicine,Reminder,MedicineLog}.js
backend/middleware/auth.js
backend/utils/{validate,date,upload,cosUpload,deleteCos,tencentCos,emailCode,mail,captcha}.js
backend/config/{db,redis}.js
backend/.env.example
```


