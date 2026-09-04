# Carevial 落地页（Vue 3 实现）

用 Vue 3 + Vite + Tailwind CSS 复刻的 Carevial（智能家庭用药管理）首页落地页。
与原 React 版页面在 1440 / 1024 / 768 / 390 四种宽度下逐像素一致。

## 运行

```bash
npm install
npm run dev      # 开发服务器 http://localhost:5173
npm run build    # 产物输出到 dist/
npm run preview  # 预览构建产物
```

## 页面结构

| 路由         | 内容                                                       |
| ------------ | ---------------------------------------------------------- |
| `/`          | 落地页：导航、Hero、智能提醒、家庭档案、AI 顾问、CTA、页脚 |
| `/dashboard` | 登录成功后的占位页                                         |
| `/feedback`  | 反馈页占位（原站为独立页面，未在本次范围内）               |
| 其他         | 404 页                                                     |

## 目录

```
src/
├── assets/main.css          # Tailwind 引入 + 设计令牌（oklch 色阶、字体）
├── components/
│   ├── LogoMark.vue         # 药丸 Logo，支持 sm / md / lg
│   ├── SiteNav.vue          # 顶部固定导航（毛玻璃）
│   ├── HeroSection.vue      # 首屏文案 + 入场动画
│   ├── HeroIllustration.vue # 手绘风 SVG 插画（crayon 滤镜）
│   ├── ReminderSection.vue  # 今日提醒卡片
│   ├── FamilySection.vue    # 家庭成员卡片
│   ├── AiAdvisorSection.vue # AI 对话卡片
│   ├── CtaSection.vue
│   ├── SiteFooter.vue
│   ├── AuthModal.vue        # 登录 / 注册弹窗
│   └── CaptchaField.vue     # Canvas 图形验证码
├── composables/
│   ├── useAuth.js           # 前端模拟鉴权（localStorage）
│   └── useInView.js         # IntersectionObserver 滚动入场
├── router/index.js
└── views/
```

## 实现要点

### 设计令牌

原站颜色以 oklch 三元组存于 CSS 变量，这里迁移为 Tailwind v4 的 `@theme`：
`background` / `foreground` / `primary` / `accent` / `secondary` 五组各 11 级色阶。
字体为 DM Sans（正文）与 Playfair Display（标题）。

两处为对齐原站渲染而做的显式处理，见 `src/assets/main.css` 注释：

- 原站 `lang="en"`，中文字形经通用 `serif` 落到黑体；本项目页面语言为 `zh-CN`，因此在标题字体栈中显式声明中文字体。
- 原站基于 Tailwind v3，v4 将 `sm` 档位整体上移一级，故把 `--radius-sm` / `--blur-sm` / `--shadow-sm` 对齐回 v3 取值。

### 交互

- 滚动入场动画用 `IntersectionObserver`（阈值 0.15，只触发一次）。
- 登录 / 注册为纯前端模拟：账号存在 `localStorage`（键 `yaoguanjia_users` / `yaoguanjia_auth`），
  内置测试账号 `test@example.com / 123456`。
- 邮箱验证码为测试模式，6 位、5 分钟有效，直接显示在表单里；发送前必须先通过 Canvas 图形验证码。
- 登录成功跳转 `/dashboard`。

## 未包含

原站登录后的应用内页面（健康档案、药品管理、用药提醒、用药打卡、AI 助手、设置等）
以及完整的反馈表单页不在本次落地页实现范围内。
