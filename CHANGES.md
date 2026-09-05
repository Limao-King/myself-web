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

## 回归验证记录（localhost:4321，v2.1 后复验）

- 构建通过；生产 HTML 中 `eb-view-toggle` / `eb-classic` 出现 0 次。
- 桌面 1440px：首页（hero 72px 标题 / 导航无经典按钮 / 雪花屏为原版裸白三角 + 压暗噪点 / 任务日志 2019–2022）/ docs 列表（首屏无鬼影、页脚实底）/ docs/bg3（标题即时渲染、正文 42em、TOC 正常）/ about（页脚可读）。
- 移动 390px：精品文档卡字号可读、按钮堆叠正常。
- `docs/fairytale-plan`：`pre` 计算样式 `rgb(36,41,46)`，正文列宽 672px @16px（=42em）。
- 交互实测：试玩惰性挂载 + 电源灯点亮 ✓（加载层为 v2.0 新增，逻辑已过读码校验）。
