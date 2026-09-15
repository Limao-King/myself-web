# CHANGES.md — 设计优化变更清单（v2.1 最终状态）

> 本文件面向 AI / 开发者，记录 2026-09-05 在「个人网站搭建（改进）」副本上完成的全部代码变更。
> 基线：原仓库 commit `e1b770c`（数据：饥荒时长更正为200+）。改动已 git add 暂存，未 commit。
> 所有变更已通过 `npx astro build` 与浏览器回归（桌面 1440px / 移动 390px，localhost:4321）。

## 修订记录

| 修订 | 内容 |
|---|---|
| v2.0 | 首轮设计优化全部落地（见下方逐文件明细） |
| v2.1（用户决策回退 3 项） | ① 雪花屏 ▶ 播放键的圆底托+奶油描边回退为原始裸白三角（噪点压暗保留）；② 经典视图（纸质模式）功能整体移除——开关、localStorage 偏好、全部 `.eb-classic` 样式；③ 首页「图鉴」区文档回退为与 Hero 堆相同的 3 篇（bg3 / fairytale-plan / world-regions），`codexDocs` 拆分撤销 |

## 变更总览（按主题，v2.1 最终状态）

| 主题 | 涉及文件 |
|---|---|
| 高优 bug：eb2 页脚对比度 | `src/styles/eb.css` |
| 高优 bug：首屏 reveal 幽灵态 | `src/styles/global.css`、`src/pages/docs/[slug].astro`、`src/pages/docs/index.astro`、`src/pages/about.astro` |
| 高优 bug：pre 代码块配色写死 | `src/styles/global.css` |
| 背景降噪 + iOS fixed 渐变迁移 | `src/styles/eb.css` |
| 雪花屏降噪（噪点压暗；播放键形态保持原版） | `src/styles/eb.css`、`src/pages/index.astro` |
| 行长 42em 全局化 | `src/styles/global.css`、`src/styles/eb.css` |
| 移动端小字号修正 | `src/pages/index.astro` |
| 像素字体 12px 网格对齐 | `src/pages/index.astro`、`game-history.astro`、`projects/index.astro`、`about.astro`、`src/styles/eb.css` |
| 项目日期口径统一 | `src/utils/format.ts`、`src/pages/index.astro`、`src/pages/projects/index.astro` |
| TV 加载反馈 | `src/pages/index.astro`、`src/styles/eb.css` |
| 遭遇战时长 3s→6s | `src/pages/index.astro` |
| 经典视图功能整体移除 | `src/components/Nav.astro`、`src/layouts/Layout.astro`、`src/pages/index.astro`、`src/styles/eb.css` |
| 草稿页移出生产构建 | `astro.config.mjs` |
| 死代码清理 + header 变量化 | `src/styles/global.css`、`src/styles/eb.css`、删除 2 组件 |
| theme-color / 404 主题 | `src/layouts/Layout.astro`、`src/pages/404.astro` |
| 内容微调 | `src/content/projects/fairytale-demo.md` |

## 逐文件明细

### 1. `src/utils/format.ts`
- **新增** `formatPeriod(start?: Date, date?: Date): string`
  - 逻辑：`start` 与 `date` 跨年 → `YYYY–YYYY`（en dash）；同年或缺 `start` → `YYYY.MM`（取 `date ?? start`）；均缺 → `''`。
  - 用途：统一首页任务日志与项目卡的日期口径（此前列表用 start 年份、卡片用 date 年份，观感像数据错误）。

### 2. `src/styles/global.css`
- **删除死代码**：`.btn-ghost` 与 `.btn-accent` 的全部规则（基础/`::after`/hover/active）。全站无任何 `.astro` 文件引用这两个类。
- **reveal 动画收紧**（反幽灵态）：
  - `.js .reveal` transition `0.7s` → `0.45s`；
  - `.js .reveal-up` translateY `24px` → `14px`。
- **滚动进度条主题化**：`.scroll-progress` 的 `background` 改为 `var(--progress-bg, linear-gradient(90deg, #4c8a30, #d98c2b))`；各主题通过覆盖 `--progress-bg` 换单色。
- **行长控制**：新增 `.prose-article :is(p, li, blockquote) { max-width: 42em; }`。
  - 此前只有 `.eb-theme .prose-article > p`（直接子级 p）限宽，li / blockquote 内段落 / `.eb-dialog` 均通栏 70+ 字/行。
- **pre 深底写死**：`.prose-article pre` 由 `@apply bg-neutral-900`（本站反向 token 中是浅米 `#fbf7ec`）改为显式 `background: #24292e; border-color: #30363d;`；`pre code` 的浅色 `#e1e4e8 !important` 保留并更新注释。
- **site-header 变量化**（消 !important 特异性战争）：
  - `.site-header` 新增变量：`--header-border-w`（默认 3px）、`--header-border`（#262016）、`--header-shadow`（原双 inset 阴影）、`--header-image`（none）、`--header-blend`（normal）、`--header-img-size`（auto）；
  - `border-bottom` → `var(--header-border-w) solid var(--header-border)`；`box-shadow` → `var(--header-shadow)`；`background-image/repeat/size/blend-mode` 全部由变量驱动；
  - 既有 `--nav-bg / --nav-ink / --nav-link / --nav-link-active` 保持为唯一文字颜色来源（`.link-underline::after` 用 `currentColor`，下划线自动跟随）。

### 3. `src/styles/eb.css`
- **背景渐变迁移（iOS 修复）**：
  - `.eb-theme body` / `.eb2-theme body`：删除 `background-image` 纵向渐变 + `background-attachment: fixed` + `background-size`，仅保留 `background-color` 兜底（#708650 / #b4a88e）。
  - 渐变改画在 `.eb-theme .bg-pattern` / `.eb2-theme .bg-pattern`（该容器本身 `position:fixed`，视口固定效果等同且 iOS Safari 支持）。
- **纹样降噪**：`.eb-theme .bg-pattern::before`（spark.png）opacity `0.72 → 0.45`；`.eb2-theme .bg-pattern::before`（mail.png）`0.7 → 0.42`。
- **进度条变量**：`.eb-theme #scroll-progress { --progress-bg: var(--eb-yellow) }`；`.eb2-theme #scroll-progress { --progress-bg: #9a5a1e; height: 3px }`。
- **site-header 全部改为变量覆盖**（对应 global.css 的新变量表），删除以下 !important 规则组：
  - `.eb-theme .site-header` → `--nav-bg:#b4c586; --nav-link:#3a4522; --nav-link-active:#243a1a; --header-border-w:2px; --header-border:#6f8f48; --header-shadow:0 2px 0 #262016; --header-image:url(/images/patterns/dust.png); --header-blend:multiply; --header-img-size:32px 32px`；
  - `.eb2-theme .site-header` → `--nav-bg:#6b9ca8; --nav-link:#1f2e34; --nav-link-active:#152024; --header-border-w:2px; --header-border:#4a7580; --header-shadow:0 2px 0 #262016` + dust 底噪变量；
  - `.eb-theme #mobile-menu` 与 `.eb2-theme .site-header #mobile-menu` 的 `background-color !important` 删除（移动菜单走 Tailwind 任意值类 `bg-[var(--nav-bg,#b4c586)]`，自动跟随变量）；
  - 删除 `.eb-theme #nav-toggle`、`.eb-theme .nav-brand` 的颜色覆写（由 `--nav-ink` 驱动）。
- **页脚修复（高优 bug）**：`.eb-theme footer` 及其 `::before`（8px 棋盘 dither 边）、`.text-neutral-400/.text-neutral-500/.border-neutral-700\/70/a` 系列选择器全部扩展为 `.eb-theme footer, .eb2-theme footer`。此前 eb2 页页脚无实底，文字叠在 mail 纹样上不可读。
- **删除** `.eb-theme .prose-article > p { max-width: 42em }`（由全局 `:is(p, li, blockquote)` 规则接管）。
- `.eb-dialog` 新增 `max-width: 42em`。
- `.eb-window__title` font-size `1.15rem → 1.5rem`（24px = 12px 点阵 ×2，像素颗粒均匀）。
- `.eb-encounter__line` font-size `1.4rem → 1.5rem`。
- **雪花屏**：
  - `.eb-tv__static .eb-cover-warp` 新增覆写 `opacity: 0.55; mix-blend-mode: normal`（噪点压暗一档，**保留**）；
  - `.eb-tv__play` **保持原版形态**（裸白三角 + text-shadow + 呼吸闪烁；v2.0 曾加圆底托+奶油描边，v2.1 按用户决策回退。压暗后的噪点保证了裸三角的对比度）。
- **加载反馈**：`.eb-swap__loading` 新增 `z-index: 2`（压在未就绪 iframe 之上）、像素字体、`animation: eb-loading-blink 1.1s steps(2) infinite`；新增 `@keyframes eb-loading-blink { 50% { opacity: .55 } }`。
- **删除死代码**：`.eb-cover-pattern`、`.eb-cover-title`、`.eb-battle__stage[data-cover] .eb-play-launch`、`.eb-play-launch:hover`（旧封面方案的遗留，标记中无对应类）。
- **经典视图整体移除（v2.1）**：删除全部 `.eb-theme.eb-classic` 规则块（约 120 行：body 纸面背景、header 变量组、四角方块、按钮、状态栏、图鉴行、页脚、`.bg-pattern` 覆写、`.eb-view-toggle` 样式及所有相关注释）。搜索确认文件内 `eb-classic` 出现 0 次。
- **reduced-motion 块**新增：`.eb-swap__loading, .eb-tv__play, .eb-tv__power { animation: none }`。

### 4. `src/layouts/Layout.astro`
- head 新增：`<meta name="theme-color" content={theme === 'eb2' ? '#6b9ca8' : '#b4c586'} />`（移动端浏览器顶栏随主题）。
- **删除**内联脚本中的 `localStorage['eb-view']` 读取与 `eb-classic` 类注入（v2.1 经典视图移除）。
- `<Nav eb={theme === 'eb'} />` → `<Nav />`（Nav 不再需要 eb prop）。

### 5. `src/components/Nav.astro`
- **移除 Props 的 `eb` 字段**及解构（v2.1；该 prop 此前仅服务于经典视图开关）。
- v2.0 曾添加的 `.eb-view-toggle` 按钮（桌面 li + 移动菜单 li）与 initNav 中的开关逻辑在 v2.1 全部移除；组件恢复为"品牌 + 链接 + 简历按钮 + 移动菜单"。

### 6. `src/pages/index.astro`
- **frontmatter**：
  - 删除本地 `fmtYm()`，改用 `import { formatPeriod } from '../utils/format'`；
  - `featureDocs`（bg3 / fairytale-plan / world-regions）保持供 Hero 文档堆与「图鉴」区共用（v2.0 曾拆出 `codexDocs`，v2.1 按用户决策回退）。
- **模板**：两处均映射 `featureDocs`；任务日志日期 `{formatPeriod(p.data.start, p.data.date)}`。
- **删除死类 `px`**：`.eb-tv__brand`、`#eb-play-launch`、`.eb-tv__dialog` 三处（该类仅在 4 个预览页的 scoped style 中有定义，首页上从未生效；像素字体已由 `.eb-tv__*` 自带）。
- **`launch()` 加载反馈**：首次启动时 `playIframe.style.visibility='hidden'`，恢复 `.eb-swap__loading` 的 display，挂 `once` 的 `load` 监听后置 `src`；onload 后 loading `display:none` + iframe `visibility:visible`。二次启动（video 槽返回后）会先恢复 loading 显示。解决"点击试玩后数秒白屏无反馈"。
- **`initEncounter()`**：自动消失兜底 `setTimeout(dismiss, 3000)` → `6000`。
- **`initCoverWarp()/drawStatic()`**：噪点灰度 `Math.random()*255` → `56 + Math.random()*152`（收窄灰阶，配合 CSS 压暗）。
- **`initBattleMedia()`**：删除监听 `eb-classic` 类的 MutationObserver 及其在 before-swap 的 disconnect（v2.1 经典视图移除后无存在意义）。
- **scoped styles**：
  - `.home-hero .eb-title` clamp 上限 `4.35rem → 4.5rem`（72px = 12 网格 ×6）；
  - 移动端 `.home-doc` 系列：padding `.5rem .55rem .45rem → .65rem .75rem .55rem`；字号 `__em .5→.62rem`、`__title .72→.82rem`、`__sum .58→.68rem`（≈11px，原 9.3px 低于可读底线）、`__cta .6→.66rem`。

### 7. `src/pages/docs/[slug].astro`
- 文档头（h1 / 日期 / 标签 / PDF 按钮）移出 `<Reveal>` 包裹，直接渲染（首屏 Reveal 豁免）；正文仍保留 `<Reveal delay={120}>`。

### 8. `src/pages/docs/index.astro`
- `<SectionHeading>` 与搜索框 + 筛选 chips 移出 `<Reveal>`（首屏豁免）；下方各列表区块保留 Reveal 与交错延迟。

### 9. `src/pages/about.astro`
- Hero 区移出 `<Reveal>`；bio / 教育背景 / 技能栈保留。
- `.about-hero h1` clamp `(2.2rem,5vw,3.7rem) → (2.25rem,5vw,3.75rem)`（上限 60px = 12 网格 ×5）。

### 10. `src/pages/game-history.astro`
- `.history-hero h1` clamp `(2rem,5vw,3.5rem) → (2.25rem,5vw,3.75rem)`。

### 11. `src/pages/projects/index.astro`
- 引入 `formatPeriod`；项目卡 meta 由 `{date.getFullYear()} · {type}` 改为 `{formatPeriod(p.data.start, p.data.date)} · {type}`（显示"2019–2022"式区间，与首页口径一致）。
- `.project-board__head h1` clamp `(2rem,5vw,3.4rem) → (2.25rem,5vw,3.75rem)`。

### 12. `src/pages/404.astro`
- `<Layout title="页面不存在">` → `<Layout title="页面不存在" theme="eb">`（归入 EB 主题，风格不再与全站断裂）。

### 13. `src/components/Achievements.astro`
- `bindLv5()` 新增 `astro:before-swap`（once）清理：移除 window 上的 scroll `check` 监听并复位 `lv5Bound = false`。
- 修复的问题：监听器跨页面残留——离开首页后在任意页面滚到底都会触发 Lv.5 判定（仅靠 `fire()` 的 localStorage 去重兜底）；且 `lv5Bound` 不复位导致再次回首页时永不重绑。

### 14. `astro.config.mjs`
- 新增 `PREVIEW_ROUTES = ['color-preview','gpt-preview','paper-note-preview','project-paper-layout','roadtrip-preview']` 与 `dropPreviewPages()` integration：
  - `astro:build:done` 钩子中对 `dist/<route>/` 与 `dist/<route>.html` 执行 `rm(recursive, force)`；
  - dev 模式不受影响，预览页仍可本地访问；生产 dist 中彻底剔除（防止招聘方翻到设计草稿）。
- 已在 `integrations` 注册；构建日志确认执行（"已从生产构建剔除预览页…"）。

### 15. 删除文件
- `src/components/Timeline.astro`、`src/components/EbBattleBg.astro`——全站无引用（`git rm`）。

### 16. `src/content/projects/fairytale-demo.md`
- 删除 L48 的 `> 点击即可放大图片。`——与 JS 注入的「🔍 竖版大图 · 点击放大查看」提示语义重复。

### 17. 构建产物
- `dist/` 已用最终版源码重建（25 页），其中 5 个预览页路由不存在。

## 给后续 AI/开发者的注意事项

1. **颜色改动只动变量**：头部导航的文字/底色全部走 `.site-header` 变量表（global.css），主题差异在 eb.css 以变量覆盖实现；不要再往 `.link-underline` 或 `#mobile-menu` 上写硬编码色，也不要恢复 `!important`。
2. **`--progress-bg`**：滚动进度条颜色变量，默认值（渐变）写在 global.css 的 fallback 里，eb/eb2 各自覆盖单色。
3. **`.eb-swap__loading`**：依赖"iframe load 后 JS 置 `display:none`"的时序（index.astro `launch()`），重构电视区需保持。
4. **雪花屏**：`.eb-tv__play` 保持原版裸白三角（用户决策，勿再加底托/描边）；噪点压暗由两处共同承担——CSS `.eb-tv__static .eb-cover-warp { opacity:.55 }` 与 JS `drawStatic()` 的灰阶 56–208，二者缺一对比度都会退化。
5. **经典视图已彻底移除**：全站不应再出现 `eb-classic` / `eb-view` / `.eb-view-toggle`；`Nav` 组件不再接收 `eb` prop。
6. **页脚**：eb/eb2 共用同一套实底页脚规则（eb.css 中并列选择器），新增主题时记得同步。
7. **预览页**：新增设计草稿页时，把路由名追加进 `astro.config.mjs` 的 `PREVIEW_ROUTES`，否则会发布到生产。
8. **像素字体**：新增大号像素字（h1/h2 级）请取 12px 的整数倍（24/36/48/60/72）；小号 UI 字不受此约束。
9. **未处理项（待内容决策）**：项目卡封面 `object-fit: cover` 会裁掉童话冒险标题画面边缘，建议提供 16:9 封面图后替换，代码侧无更优解。
10. **访问记录端点 `POST /hit` 只写不读，且必须绑死来源**：主站 `Layout.astro` 底部有一行 `sendBeacon` → `https://play.limao.site/hit`；Worker 侧只接受 POST、校验 `Origin` 必须命中白名单（`ALLOWED_ORIGINS`）、载荷 ≤1 KiB、命中脚本 UA 静默丢弃。**不要给它加读取接口** —— 查看数据走本机 `node scripts/view-visits.mjs`。加读接口 = 把访问日志公开挂在线上。
11. **`wrangler r2 object list` 在当前 wrangler（v4.128）不存在**：`r2 object` 只有 `get`/`put`/`delete`。所以访问记录**按天聚合成一个对象**（`analytics/days/YYYY-MM-DD.jsonl`，一行一条），读取退化为一次 `get`；**不要**改成"一次加载一条对象"，那样命令行读不到、只能在面板里翻。
12. **手机号不进任何源码/配置**：`src/site.config.ts` 只留 `email`/`github`。简历 PDF 里保留手机号（HR 的联系方式来源，且 ATS 需要可解析文本），PDF 只在 `public/_headers` 里加了 `X-Robots-Tag: noindex` 防索引 —— **不要**把手机号做成图片或从 PDF 拿掉，会削弱 HR/ATS 的可用性。

---

## v2.3（2026-09-09 · bug 巡检：docs 长文档正文隐形）

> 基线 v2.2。巡检方式：dev 起服后 Playwright 逐路由走查（20 条路由 × 桌面 1440×900 / 笔记本 1366×768 / 移动 390×844），检查控制台报错、资源 404、横向溢出、标题层级、图片完整性、交互（表情气泡 / 移动菜单 / 文档搜索 / 电视试玩）。

### 修复：长文档正文永久不可见（P0）

| 项 | 内容 |
|---|---|
| 文件 | `src/layouts/Layout.astro`（1 行） |
| 症状 | docs 详情页正文整段停在 `opacity: 0`，滚动到页面中部也不出现；移动端 390px 下 **11 篇文档里 7 篇整页空白**，桌面 1440×900 下 5 篇空白（1366×768 下更多） |
| 根因 | `initReveal()` 的 IntersectionObserver 用 `threshold: 0.12`（要求元素 **12% 面积**进入视口）。docs 详情页把 `<Content />` 整篇包在一个 `<Reveal>` 里，容器高度 7000–28000px，**12% 远大于视口高** → 回调永不触发 → `.is-revealed` 永不添加 |
| 修法 | `threshold: 0.12` → `threshold: 0`；`rootMargin: '0px 0px -48px 0px'` 保持不变（「提前 48px 触发」的观感由它负责，不依赖 threshold） |
| 验证 | 20 路由 × 3 视口共 60 次检查：所有 `.reveal` 滚入视口后 opacity = 1；滚动触发动画观感不变；`npx astro build` 零报错 |

### 巡检结论（无问题，记录备查）

- 构建 26 页零报错，5 个预览页正确剔除；全部路由 200
- **0 个控制台报错 / 0 个未捕获异常**
- 图片：全部 200（`.eb-log-thumb` 等懒加载图在「未滚到」时会显示为未完成，属正常，**不是破损**）
- 320 / 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1600 / 1920px 共 10 个宽度**均无横向溢出**
- 交互：点「不要」表情气泡与页面所有可见 `a`/`button` 矩形相交检测 = **空数组**；移动端汉堡菜单开合正常；docs 搜索筛选正常；404 页归属 EB 主题且有页脚；跳转链接聚焦可见
- 标题层级无跳级（首页 / docs 列表 / 文档详情 / 项目列表 / 项目详情）；页脚高度 115px
- 移动端 docs 代码块：`pre` 内容 440px > 容器 297px，`overflow-x: auto` 正常横滑，不溢出页面（**注意：不要给 `pre` 改成 `overflow: hidden`，否则会截断**）

### 巡检发现但未处理（待用户决策）

- `/robots.txt`、`/sitemap-index.xml` 均 404（SEO 建议项，非 bug）
- 首页 2 处 `alt=""`（`index.astro:34` Hero 精品文档卡封面、`:168` 任务日志缩略图）——均为「链接内已有等价文本」的装饰图，空 alt 是合法写法；导航栏品牌头像已在 `Nav.astro:19` 用 `role="img"` + `aria-label` 处理
- `.gitignore` 中文注释为乱码（编码混淆，不影响规则生效）

## 回归验证记录（localhost:4321，v2.1 后复验）

- 构建通过；生产 HTML 中 `eb-view-toggle` / `eb-classic` 出现 0 次。
- 桌面 1440px：首页（hero 72px 标题 / 导航无经典按钮 / 雪花屏为原版裸白三角 + 压暗噪点 / 任务日志 2019–2022）/ docs 列表（首屏无鬼影、页脚实底）/ docs/bg3（标题即时渲染、正文 42em、TOC 正常）/ about（页脚可读）。
- 移动 390px：精品文档卡字号可读、按钮堆叠正常。
- `docs/fairytale-plan`：`pre` 计算样式 `rgb(36,41,46)`，正文列宽 672px @16px（=42em）。
- 交互实测：试玩惰性挂载 + 电源灯点亮 ✓（加载层为 v2.0 新增，逻辑已过读码校验）。

---

## v2.2（2026-09-09 · 第三方审计落地 + 视觉打磨 + 表情气泡定位）

> 基线 v2.1。commit `cbf4af7` 落地审计建议与视觉打磨；表情气泡定位为本轮收尾改动。

### 审计落地（第三方设计审查报告）

| 项 | 文件 | 内容 |
|---|---|---|
| docs 卡片统一 EB 语言 | `src/components/Card.astro` | 去掉 `rounded-xl` + violet 悬停，改 `#f4ecd8` + 2px 棕描边 + 硬阴影 + 直角深色 chip |
| `/docs/` 分区标题 | `src/pages/docs/index.astro` | 紫竖条 → `◆ 拆解案` 窗标题 |
| 双 H1 修复 | 4 个项目 md | 删除正文隐藏 h1（页面只留任务卡一个 h1） |
| 对比度合规 | `src/styles/eb.css` | 电视区 `/` 分隔符 3.57→5.20:1；页脚链接 4.13→5.83:1 |
| 触控目标 | `Footer.astro`、`eb.css`、`global.css`、`projects/[slug].astro` | 页脚链接/返回顶部/backlink/zoom-hint/下载链接 → **移动端 44px**（桌面恢复原高） |
| odo 读屏加固 | `src/layouts/Layout.astro` | `.eb-odo__reel` 与其内部 `<i>` 加 `aria-hidden` |
| 页脚精简 | `src/components/Footer.astro` | 删除「GAME DESIGN PORTFOLIO」副标题 + 分隔线，桌面高度 191→115px |

### 视觉打磨

| 项 | 文件 | 内容 |
|---|---|---|
| hero 目标岗位 | `src/pages/index.astro` | eyebrow 补「目标岗位：游戏系统 / 文案策划」（同色系深绿加粗，不引入新色） |
| hero 间距 | `src/pages/index.astro` | gap 2.5→2.7rem + 卡片左偏 -2.8→-1.2rem；文字区与卡片最小间距 -5px（侵入）→ 34px |
| 「至今的冒险」 | `src/pages/index.astro` | 限宽 45em 左对齐；数字 `vertical-align: 0.05em` 与正文基线对齐 |
| 项目列表「4」 | `src/pages/projects/index.astro` | 分区像素实测上提 2px + 微调 0.5px，与字母 y 范围完全一致 |
| 移除满格火焰表情 | `Layout.astro`、`eb.css` | 删除 `#eb-energy-emoji` 与 `lit-strip.png`（保留点击简历/邮件/不要的通用表情反馈） |
| 游戏文案 | `src/data/games.ts` | `10年时期QQ游戏` → `10年代QQ游戏` |

### 表情气泡定位（本轮收尾）

- 文件：`src/layouts/Layout.astro`、`src/pages/index.astro`
- 逻辑：依次尝试「**上方居中 → 右侧居中 → 下方居中**」，并避开顶部导航栏；调用时传入被点击元素以取其边界
- 目的：既不遮挡被点击按钮，也不遮挡同行相邻按钮（如「不要」右侧紧挨的「直接联系」）
- 验证：遍历页面所有可见 `a`/`button` 做矩形相交检测 —— 点「不要」结果为**空数组**（零重叠）；导航栏「简历」为右侧 22px 居中

### 注意事项补充

- ⚠️ **`.eb-odo` 的 `vertical-align` 是语境相关的**：全局 `-0.14em` 面向小字号独立显示；与正文/英文混排处需单独覆盖（首页 `.home-num .eb-odo: 0.05em`、项目列表 `.project-board__eyebrow .eb-odo: -0.017em`）。**改字号后必须重新做像素级校准**，不要靠目测。
- ⚠️ **`.eb-emoji-pop` 定位依赖元素边界**：调用 `window.__ebPop(name, x, y, el)` 时**必须传第 4 个参数（被点击元素）**，否则退回坐标估算，可能压住按钮。

---

## v2.4 访问记录端点（`/hit`）

### 端点的状态码契约（回归时按此表核对）

| 输入 | 响应 |
|---|---|
| 非白名单 Origin / 无 Origin | 403 |
| Content-Type 非 `text/plain`·`application/json` | 415 |
| 载荷 > 1 KiB | 413 |
| JSON 解析失败 | 400 |
| 命中脚本 UA（或无 UA） | 204（静默丢弃，不进库） |
| 正常 | 204 并追加一行到 `analytics/days/YYYY-MM-DD.jsonl` |
| `GET /hit` | 405 + `Allow: POST` |
| `POST /`（既有行为） | 405 |

### 设计层影响

**零**。`Layout.astro` 本轮为**纯新增**（diff 只有 `+` 行）；`src/styles`、`src/components`、`src/pages`、`src/content`、`tailwind.config`、`astro.config` 均未改动。

### 注意事项补充（13–15）

- ⚠️ **`view-visits.mjs` 的「判定」列不是结论**：仅按 UA 猜测，搜索引擎爬虫（Googlebot/Bingbot）会伪装成正常浏览器 UA 而被判成「疑似真人」。**更可靠的机器信号是"同一 IP 哈希反复出现 ≥5 次"**。哈希按天换盐，跨天不可关联，且**不能反查明文 IP**（刻意设计）。
- ⚠️ **记录里的「国家 + ASN」是区分"自己人"与"外部"的主要判据**：本机直连为 CN；AS134972 是香港代理服务商（IKUUU NETWORK LTD）、AS9808 是中国移动。**出现 CN 基本可确定是本机自测**。
- ⚠️ **图例已内嵌脚本输出**：`node scripts/view-visits.mjs` 会直接打印各列含义，无需另查文档。

---

## v2.5 爬虫归因能力（服务器侧查询）

### 背景结论（重要）

`/hit` 由 `sendBeacon` 上报 = **客户端**脚本。**绝大多数爬虫不执行 JS**，因此它们**永远不会出现在 `analytics/` 里**。
`view-visits.mjs` 只能回答"有没有执行了 JS 的访客"，**不能**回答"谁在爬我"。
且 Cloudflare Web Analytics 的维度只有 Country/Host/Path/Referer/Device/Browser/OS/Site/Exclude Bots/Navigation type
—— **没有 ASN、没有 User-Agent**，也无法定位具体爬虫。要归因爬虫只能看**服务器侧**数据。

### 新增

| 文件 | 内容 |
|---|---|
| `scripts/query-cf-http-analytics.mjs` | Cloudflare GraphQL Analytics API 查询 `AccountHttpRequestsAdaptiveGroups`，按 Host/ASN/UA/国家/路径/已验证爬虫聚合，内置爬虫 UA 特征表；**字段在当前套餐不可用时自动从报错中识别并剔除后重试**；`--raw` 可无凭据打印 GraphQL 语句 |
| `scripts/view-visits.mjs` | 输出末尾新增**列含义图例**（时间/国家/ASN/判定/路径/来源/同IP≥5 各自能判断什么） |
| `.gitignore` | 新增 `.cf-token` / `.cf-zone` / `.cf-account`（已用 `git check-ignore` 实测确认生效） |

### 可操作的归因手段

- **ASN 反查（免费、无需 key）**：`curl -s https://ipinfo.io/ASxxxxx/json` 或 `https://ipinfo.io/<ip>/json`
- **爬虫 ASN 数据集**：IPinfo 的 crawler 标签页（1,622 个 ASN）— https://ipinfo.io/tags/crawler
- **爬虫自称与伪造率**（CC BY 4.0，WebDecoy）：https://webdecoy.com/bots/
  —— 实测 **45.8% 的自称爬虫请求并非来自其声称的运营方**（GPTBot 54.9%、Googlebot 46.5%、bingbot 10.8%）。
  **结论：UA 只能表示"它自称是谁"，不能作为身份依据。**

### 注意事项补充（16–19）

- ⚠️ **不要把 `view-visits.mjs` 的结果当作爬虫统计**：它看不到非 JS 爬虫，样本天然偏向"像浏览器的访客"。两者数量级差 3 位是正常的。
- ⚠️ **免费套餐查不到 ASN**：`clientAsn` / `clientASNDescription` 会被拒绝（`does not have access`）—— 属**套餐限制**而非 token 权限问题；脚本会自动剔除以继续出表。
- ⚠️ **GraphQL 的 `filter` 在同一选择集只能出现一次**：host 条件必须并入同一个 `filter` 对象，否则查询语法错误。
- ⚠️ **Cloudflare 报错中的字段名是全小写**（`botScore` → `'botscore'`）：剔除字段时必须**大小写无关**匹配，否则降级逻辑失效。
- ⚠️ **`view-visits.mjs` 读到「0 条」有两种完全不同的含义**（2026-09-15 修）：①真的没有对象（那天没人来）②**读失败**（超时/权限）。旧版把两者吞成同一个 `null` 并打印"7 天无对象"，曾把一次 10.7 秒的连接超时误报成"没有记录"。现在读失败会**单独列出失败日期与原因，并 `exit 1`**。

---

## v2.6 `view-visits.mjs` 读取可靠性（区分「无对象」与「读失败」）

### 起因（实测）

Cloudflare Web Analytics 显示 223 次浏览量，同一时刻 `node scripts/view-visits.mjs --days 7` 却报「共 0 条（7 天无对象）」。查本机命令行日志发现：那两轮 14 次读取调用中 **5 次是 `TypeError: fetch failed`（连接超时）**，6 次是正常的"对象不存在"应答 —— 对象**存在且能读到**，是脚本把超时吞了。详见 `交接文档/2026-09-15-访问数据显示异常排查.md`。

### 改动

| 文件 | 内容 |
|---|---|
| `scripts/view-visits.mjs` | 新增 `classifyError()`：把读取失败分为 **对象不存在**（正常）与 **读取错误**（网络 / 权限 / 桶名 / 未识别）；读失败时打印失败日期、类别与原始报错，并 `process.exit(1)`；新增 `--verbose` 逐天打印 ✓/·/✗；`--json` 改为带 `ok / queried / counted / failed / records` 的结构 |

### 注意事项补充（20–21）

- ⚠️ **任何"0 条"结论都要先看 `failed`/退出码**：`node scripts/view-visits.mjs --days 7; echo %ERRORLEVEL%` —— **1 表示读取不完整，结论不成立**，重跑一次通常就好（本机到 `api.cloudflare.com` 时通时断，`play.limao.site` 的 `colo` 实测落在 SEA/LHR/SJC 三地）。
- ⚠️ **验证写链路要挑"能撤回"的方式**：本次排查发的一次 `POST /hit`（`path=/__diag__`）已永久留在 `analytics/days/2026-09-15.jsonl`（写入端只写不读、无删除接口）。**记录写入前先想清楚这条痕迹能不能撤。**

---
