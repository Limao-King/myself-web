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
10. **reveal 的 `threshold` 必须是 0**：`Layout.astro` 的 `initReveal()` 用 IntersectionObserver 触发 `.reveal`。**凡是把「整篇长内容」包进一个 `.reveal` 容器的地方（docs 详情页正文就是），阈值任何 > 0 的百分比都可能永不满足**（容器高 7000–28000px，12% 远超视口高）→ 内容永久停在 `opacity: 0`。详见 v2.3。
11. **Worker（play.limao.site）的 `frame-ancestors` 必须包含 `https://www.limao.site`，且绝不能是 `'none'`**：首页试玩是跨域 iframe（父页 www、子帧 play），写 `'none'` 或漏写 www 都会让试玩直接打不开。白名单在 `worker/src/index.js` 的 `FRAME_ANCESTORS`。同理，`decodeURIComponent(url.pathname)` 必须包 `try/catch`（畸形 `%FF` 类编码会抛 URIError → Cloudflare 500）。详见 v2.5。
12. **Cloudflare Pages 的每次成功构建都会留下一个「永久公开 URL」，而且"删除部署"不一定立刻让它下线**：形如 `https://<短ID>.myself-web-3w8.pages.dev` 的历史快照不会随新部署消失 —— `cb650d6` 删掉 `functions/` 后，**115 个历史部署 URL 上的泄露接口仍在正常工作**（2026-09-13 实测）。当日清理掉 117 个旧部署后，抽样发现**仍有部分已删 URL 在边缘继续执行旧 Function**（不是缓存：全新路径与随机查询串同样中招）。**结论：在这个项目里"删代码"≠"下线能力"——加任何带敏感逻辑的东西前，先想清楚它会永久留在多少个 URL 上。** 详见 v2.5 末尾。
13. **`worker/` 的部署是独立的一步，且 `wrangler deploy` 有副作用**：① 它**不由 Pages 部署**，push 到 `main` 只记录源码，线上 Worker 不变，必须 `cd worker && npx wrangler deploy` 才生效；② 需要一个**本机已有的 wrangler 凭证**（OAuth 存在 `C:\Users\14273\AppData\Roaming\xdg.config\.wrangler\config\default.toml`，**是密钥文件，别提交**），非交互环境下没有凭证会直接报错要求 `CLOUDFLARE_API_TOKEN`；③ `wrangler.toml` 里**没写 `workers_dev` 时，wrangler 的默认值会随账号状态变化**——2026-09-02 那次它默认**停用** workers.dev，2026-09-13 那次默认**启用**，于是 `fairytale-game.limao233666.workers.dev` 与版本预览 URL 被一起打开（绕过 zone 规则、且历史版本可被访问）。**只要 play 只需要 `play.limao.site` 一个入口，就在 `wrangler.toml` 显式写 `workers_dev = false` + `preview_urls = false`**，别依赖默认值。详见 v2.5。

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

## v2.4（2026-09-13 · 安全加固：删除调试接口 + 补安全响应头）

> 起因：Cloudflare 防火墙事件（5 条 Wordpress 漏洞扫描，全部被托管 WAF 拦截）触发用户询问站点安全性，据此做了一轮安全巡检。

### 🔴 删除：生产环境的信息泄露接口（P0）

| 项 | 内容 |
|---|---|
| 文件 | `functions/games/[[path]].js`（已 `git rm -r functions/`） |
| 性质 | **调试用 Pages Function 残留在生产**。注释自述「诊断：列出运行时绑定桶的全部对象」 |
| 实测影响 | `GET https://www.limao.site/games/<任意字符串>` → **200**，返回 `LIST-ALL count=9 keys=[games/fairytale/...]` —— **任何人可列出 R2 桶 `myself-web-game` 的全部对象名** |
| 当前严重度 | **偏低**：泄露的 9 个 key 都是本就公开可下载的游戏导出文件（wasm/pck/html/png） |
| 潜在风险 | 一旦往该桶放入非公开内容，此接口即成为「文件清单查询器」；同时泄露内部错误信息（`LIST-ERR ...`）与绑定结构 |
| 修法 | 删除整个 `functions/` 目录（该目录是 Pages Functions 路由，删掉即无 Functions；`worker/` 是独立部署，不受影响） |
| 验证 | `npx astro build` 后 `dist/` 内无 `games/` 目录；**已 push（`cb650d6`）触发 Pages 部署后线上复核：`GET /games/<随机字符串>` 返回 404（自定义 404 页），列出桶对象的行为彻底消失**；同时线上响应头出现 `Permissions-Policy` / `X-Frame-Options: DENY` / `Content-Security-Policy: frame-ancestors 'none'`（`_headers` 已生效），`play.limao.site` 游戏 canvas 仍正常渲染 |

### 🟢 新增：`public/_headers`（Cloudflare Pages 安全响应头）

`X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy`（关定位/摄像头/麦克风/支付/USB 等）· `X-Frame-Options: DENY` + `Content-Security-Policy: frame-ancestors 'none'`（防被第三方站点套框点击劫持）

**故意不加的两个头，以及原因**：

- ⚠️ **`Content-Security-Policy`（除 `frame-ancestors` 外）**：本站有内联脚本（`Layout.astro` 的 reveal / 里程计 / 表情气泡）与外部 iframe（`play.limao.site`），**CSP 配错会直接白屏**。要加必须在预览环境先验证。
- ⚠️ **`Strict-Transport-Security`**：Cloudflare 侧已默认下发，重复维护容易配错 `max-age`。

### 巡检确认（实测，非推断）

- `worker/src/index.js` **无问题**：有 `path.includes('..')` 目录穿越拦截 + 强制 `games/fairytale/` 前缀，越不出该目录。**唯一小瑕疵**：`decodeURIComponent()` 遇畸形 `%` 编码会抛异常返回 500（非漏洞，漏不出数据；可选的健壮性改进）
- **线上 `play.limao.site` 的 COEP `require-corp` 不影响被 iframe 嵌入** —— 实测线上首页点试玩后，iframe 内 canvas 正常渲染（父页未设 COEP，子帧的 require-corp 只约束它自己加载子资源）。**所以新增的 `_headers` 不会搞坏试玩**。
  - ⚠️ 反过来说：**绝对不要给主站加 `Cross-Origin-Embedder-Policy`**，那才会拦掉跨域 iframe。
- Cloudflare 已默认给主站下发 `x-content-type-options: nosniff` 与 `referrer-policy: strict-origin-when-cross-origin`（实测线上响应头）。`_headers` 里重复声明无害，好处是把配置显式化、可版本控制。
- git 历史扫描：未发现误提交的敏感文件（最大的对象是已 gitignore 的 `.tmp-assets/` 截图；唯一"敏感"文件是本就公开的 `public/明鑫-游戏策划简历.pdf`）

### 顺带发现（游戏 Demo 自身，非本站问题）

线上试玩控制台有 2 条 Godot 运行时报错：`No loader found for resource: res://assets/audio/music/battle_2.ogg`（战斗音乐资源缺失，导出时未打包或路径不符）、`Parent node is busy adding/removing children`（引擎侧 `remove_child` 调用时机问题）。**不影响游玩，但与网站无关，属 Godot 导出侧**，需要时在 Godot 项目里查。

### 未处理项（只有用户本人能做，代码侧无法代理）

1. **给 GitHub 账号开 2FA** —— Pages 绑 GitHub 自动部署，**GitHub 账号 = 网站控制权**
2. **给 Cloudflare 账号开 2FA**
3. **检查 R2 桶 `myself-web-game` 是否开了 Public access / r2.dev 子域** —— 开了则任何人可直连该桶、绕过 Worker 与所有规则，建议关闭
4. 网站公开了手机号（`src/site.config.ts`），会被爬虫收进电销名单 —— 属发布决策，非漏洞

---

## v2.5（2026-09-13 · 安全巡检深化：Worker 加固 + 全站暴露面实测）

> 基线 v2.4。本轮产物 = **一处代码修复** + **一份实测的安全现状清单**。所有结论均为实测（线上请求 / 真实浏览器 / Node 离线断言），非推断。

### 复验 v2.4 的六项修复（全部仍然生效 ✅）

| 项 | 实测结果 |
|---|---|
| `/games/<随机>` 信息泄露接口 | `https://www.limao.site/games/<随机12位>` → **404** + 自定义 404 页；无 `LIST-ALL`、无桶 key |
| `functions/` 残留 | 目录不存在；`dist/` 内无 `games/`、无 `functions/` |
| 安全头覆盖范围 | 首页 / 404 页 / **PDF / SVG / JPG** 全部带 `x-frame-options: DENY` + `frame-ancestors 'none'` + permissions-policy + referrer-policy + nosniff |
| 主站非法方法 | POST/PUT/DELETE/OPTIONS/TRACE/PATCH **全部 405** |
| `_headers` / `_routes.json` | 线上均 **404**（Pages 消费后不作静态文件服务，未泄露路由配置） |
| 敏感路径 | `/.git/config`、`/.env`、`/package.json`、`/src/site.config.ts`、`/wrangler.toml`、`/CHANGES.md`、`/求职素材集/` 全部 404 |
| dist / 本地 | 无 `.map` sourcemap；无 `.env` / `.dev.vars` / `.wrangler` 等密钥文件 |
| git 全历史（30 commits） | 无 token / 私钥 / `password=` 类特征串；无可疑文件名；`求职素材集/` 未进历史 |

### 🔧 修改：`worker/src/index.js`（play.limao.site 加固）

| 项 | 改动前（实测） | 改动后 |
|---|---|---|
| HTTP 方法 | `POST`/`PUT`/`DELETE`/`OPTIONS` 全部 **200**（原实现不看 `request.method`） | 只允许 `GET`/`HEAD`，其余 **405** + `Allow: GET, HEAD` |
| 畸形百分号编码 | `/%FF`、`/%80`、`/%C3%28`、`/%E0%A4%A`、`/%ED%A0%80` → **500**（`decodeURIComponent` 抛 URIError 未被接住） | **400** |
| R2 读取异常 | 冒泡成 500 | **502** |
| 安全头 | 仅有 COOP/COEP | 新增 `X-Content-Type-Options` / `Referrer-Policy` / `Permissions-Policy` / `Content-Security-Policy: frame-ancestors …`；且 **400/403/404/405/502 同样带全套头**（原来错误响应裸奔） |
| `HEAD` | 返回响应体 | 返回空体（保留 `Content-Length`） |

**`frame-ancestors` 白名单**：只放行 `https://www.limao.site` + `http://localhost:4321` / `http://127.0.0.1:4321`。目的是阻止第三方站点把你的游戏嵌进自己的网页（盗带宽 + 品牌混淆）。⚠️ **绝不能写成 `'none'`** —— 首页 `<iframe data-src="https://play.limao.site/">` 会直接打不开；列 localhost 是为了本地 `npm run dev` 时首页 iframe 仍能加载。

**验证（部署前，离线实测）**：Node 直接 import Worker 的 `fetch` + 桩 R2 桶 → **46 项断言全通过**（200/404/403/400/405/502 + 全套安全头 + `frame-ancestors` 含 www 且不含 `'none'` + HEAD 空体 + 中文入口名映射 + 缓存头）。另 `npx astro build` → **26 页零报错**，5 个预览页正常剔除。

**部署后需线上复验**（`cd worker && npx wrangler deploy`）：
- `POST https://play.limao.site/` → 405
- `GET https://play.limao.site/%FF` → 400（原 500）
- `GET https://play.limao.site/` 响应头含 `content-security-policy: frame-ancestors https://www.limao.site http://localhost:4321 http://127.0.0.1:4321`
- **首页点试玩 → iframe 内 canvas 仍正常渲染**（`frame-ancestors` 是本次唯一有破坏性的改动，必须实测）

### 🟡 巡检发现但本轮**未处理**（已报用户，等决策）

1. **主站没有 HSTS**（实测 HTTPS 响应无 `strict-transport-security`）。`public/_headers` 第 6–7 行注释写「Cloudflare 侧已默认下发 HSTS」——**该前提不成立**，Cloudflare 把它列为 SSL/TLS → Edge Certificates 里的**手动开关**。当前仅靠 `http→https 301` 兜底（实测 301 ✓）。**用户决策：本轮暂不处理。**
2. **`http://play.limao.site` 不跳 HTTPS，直接 200** —— 明文下 `SharedArrayBuffer` 不可用（非 secure context），Godot 试玩在 http 下起不来。建议 Cloudflare 侧对 play 也开 Always Use HTTPS。**未处理。**
3. **`public/_routes.json` 已成历史遗留**：`{"include":["/games/*"]}` 原意是"只把 /games/* 交给 Pages Functions"，而 `functions/` 已整体删除 → 规则失去对象，且会把 `/games/*` 从静态资源中排除（将来往该目录放静态文件会被挡）。不泄露（线上 404 ✓）。**用户决策：本轮不动。**
4. **简历 PDF 元数据**：`/Author = u-3083659`（WPS 本机账号名）、`/Creator = WPS 文字`、`/CreationDate` 带 `+08'00'` 时区。未发现身份证/银行卡类长数字串 ✓。介意就用 WPS 清空文档属性后重导一次。
5. **手机号（`src/site.config.ts`）的实际公开面是 4 处**：网站 HTML、简历 PDF 正文、**GitHub 公开仓库 `myself-web` 源码**、git 历史（实测该账号下唯一公开仓库即本站，32MB）。即已被搜索引擎 / GitHub 搜索可索引，不只是"网站上挂了个号"。
6. **Pages 预览部署面（需用户自查）**：每个 commit 生成一个预览 URL，含该 commit 当时的 `functions/`，理论上被删的泄露接口在旧预览里可能仍活着。实测 `myself-web.pages.dev` 是**别人的项目**（Pages 项目名全局唯一），按 6 个候选名未能定位本站项目 → 不易猜，风险低。建议在 dashboard 查看历史预览是否仍公开可访问，并给预览部署加 Cloudflare Access。

### ✅ 已排除的一条误判（记录备查，避免重犯）

曾从**原始 HTML** 推断：Cloudflare Email Obfuscation 把 3 个 `mailto:` 换成 `/cdn-cgi/l/email-protection#…`，故 `Layout.astro` 的 `href.startsWith('mailto:')` 永不命中 → 邮箱点击的「yes」表情在生产失效。**真实浏览器实测推翻了该推断**：CF 的 `email-decode.min.js` 会在文档解析后还原 href —— DOM 里 `mailto:Limao233666@outlook.com` 三个锚点齐全、`__cf_email__` 归零；点「联系我」→ `yes.png` 触发，点「简历」→ `ok.png` 触发，均正常。**结论：Email Protection 未造成功能损坏，不需要为它改代码。**

### 本轮新增的坑

- ⚠️ **Worker 的 `frame-ancestors` 必须含 `https://www.limao.site` 且绝不能是 `'none'`**（已同步到上方注意事项 11）。
- ⚠️ **`decodeURIComponent(url.pathname)` 必须包 `try/catch`**：畸形 UTF-8 百分号序列（`%FF`/`%80`/`%C3%28` 等）会抛 URIError，不接住即 Cloudflare `error code: 1101`（500），任何人一个畸形请求就能触发并刷满错误日志。

### 🚀 部署与线上复验结果（2026-09-13）

**部署**：`cd worker && npx wrangler deploy` → 上传 3.34 KiB / gzip 1.36 KiB，Version ID `76059687-a82d-48b1-bb5b-9173441b97d4`，账号 `limao233666@outlook.com`。⚠️ 该命令要求本机已有 wrangler 凭证（见下方新坑）。

| 线上复验项 | 结果 |
|---|---|
| `POST` / `PUT` / `OPTIONS https://play.limao.site/` | **405** + `Allow: GET, HEAD` ✅（原全部 200） |
| `GET https://play.limao.site/%FF` | **400** ✅（原 500） |
| `GET https://play.limao.site/` | **200**，`Cache-Control: no-cache`，全套头齐全 ✅ |
| `GET …/<中文入口名>.js` | **200**，`Cache-Control: public, max-age=31536000, immutable`，全套头齐全 ✅ |
| `GET …/missing-xyz.pck`（R2 未命中） | **404** + 全套头 ✅ |
| `GET …/x..y` / `…/a/../../etc/passwd` | **403** / **404** ✅ |
| `HEAD /` | **200**，`size_download=0`（空体）✅ |
| 实测到的响应头 | `content-security-policy: frame-ancestors https://www.limao.site http://localhost:4321 http://127.0.0.1:4321` + `x-content-type-options: nosniff` + `referrer-policy: strict-origin-when-cross-origin` + `permissions-policy`（9 项）+ `cross-origin-opener-policy: same-origin` + `cross-origin-embedder-policy: require-corp` |

**真实浏览器复验（最关键的一项，Playwright）**：打开 `https://www.limao.site/` → 点「开始试玩」→ iframe 内 Godot 引擎完整启动，截图可见战斗界面（「安妮 的行动」+ 攻击/技能/道具/防御 + 三名角色 HP/SP 条），**无任何 CSP `frame-ancestors` 拦截日志** → 白名单配置正确，试玩未被这次加固破坏 ✅。

控制台另有 2 条 **Godot 引擎侧**运行时报错（与网站无关）：`No loader found for resource: res://assets/audio/music/battle_3.ogg`（战斗音乐资源缺失）、`Parent node is busy adding/removing children, remove_child()…`（节点操作时机）。不影响游玩，要修得去 Godot 工程里查。

### ⚠️ 本次部署带出的新暴露面（**待用户决策**）

`npx wrangler deploy` 时输出警告：`Because 'workers_dev' is not in your Wrangler file, it will be enabled for this deployment by default.`；用 Cloudflare API 查证 `GET /accounts/<id>/workers/scripts/fairytale-game/subdomain` → `{"enabled": true, "previews_enabled": true}`。即当前 **`https://fairytale-game.limao233666.workers.dev` 与「版本预览 URL」都处于开启状态**（2026-09-02 那次部署时 wrangler 明确说会**停用** workers.dev，故这属于本次部署新开的口子，依据是 wrangler 自己的输出，非直接测量）。

- 为什么在意：① 该入口**绕过 limao.site 这个 zone 的一切规则**（WAF / 限流 / 未来的 Access 策略）；② `previews_enabled` 让**历史版本**各有一个公开 URL —— 包括加固前那版（无方法门、畸形编码 500、错误响应裸奔）。
- 补充：本项目所在网络对 `*.workers.dev` 是 **DNS 黑洞**（实测解析到 `103.73.161.52`，443 连接超时），所以在国内打不开它 ≠ 它没开。
- 关掉的方式（二选一）：在 `worker/wrangler.toml` 加
  ```toml
  workers_dev = false
  preview_urls = false
  ```
  再 `npx wrangler deploy`；或在 dashboard → Workers → fairytale-game → Settings 里关。

### ✅ 处置结果：已关闭 workers.dev 与预览 URL（2026-09-13，用户选择"关掉"）

**改动**：`worker/wrangler.toml` 显式写入 `workers_dev = false` + `preview_urls = false`（并附注释说明为何不能依赖默认值）。

**重新部署**：`npx wrangler deploy` → `No targets deployed for fairytale-game (0.84 sec)`，Version ID `9912d9a7-1298-4925-b511-1e85e18a75d3`。⚠️ **注意 "No targets deployed" 不等于没部署**：版本已上传并生效，这句话是说"触发器集合没有变化"（既没 workers.dev 也没 config 里的 route 需要新建）。

**API 查证（改后）**：

| 查询 | 结果 |
|---|---|
| `GET /workers/scripts/fairytale-game/subdomain` | `{"enabled": false, "previews_enabled": false}` ✅ |
| `GET /workers/scripts/fairytale-game/domains/records` | 仅 1 条：`play.limao.site`（zone `limao.site`），`"enabled": true`、`"previews_enabled": false` ✅ |

**改后功能复验**：`GET https://play.limao.site/` → **200** + 全套加固头；入口 js → 200（279815 B）；`POST /` → **405**。即关掉 workers.dev **没有影响** play.limao.site 的唯一入口。

**顺带确认的潜在风险点**：`play.limao.site` 这条自定义域**不在 `wrangler.toml` 里**，是 dashboard 侧绑定的（zone `limao.site`，cert 由 Cloudflare 签发）。也就是说「Worker 挂在哪个域名上」这件事**不受 git 里这份配置控制**——排查"域名指向变了"时别只看 `wrangler.toml`，要去 dashboard → Workers → fairytale-game → Settings → Domains & Routes，或用上面的 `domains/records` 接口查。

### ✅ 账号侧三项的核实结果（2026-09-13）

| 项 | 状态 | 依据 |
|---|---|---|
| GitHub 账号 2FA | 用户确认已开 | 用户自述（代码侧无法验证） |
| Cloudflare 账号 2FA | 用户确认已开 | 用户自述（代码侧无法验证） |
| R2 桶 `myself-web-game` Public access | **确认已关闭，无需任何操作** | 见下方三项实测 |

R2 公开面实测（账号下 R2 **只有这一个桶**）：

1. `GET /accounts/<id>/r2/buckets/myself-web-game/domains/managed` → `{"enabled": false, "domain": "pub-46b6b9b1cf3644df80190bf1725a8cf2.r2.dev"}` —— r2.dev 开发地址**未启用**
2. `GET /accounts/<id>/r2/buckets/myself-web-game/domains/custom` → `{"domains": []}` —— **没有绑定自定义域**
3. 直连 `https://pub-46b6b9b1cf3644df80190bf1725a8cf2.r2.dev/games/fairytale/` → **401 Unauthorized**（DNS 正常解析到 Cloudflare IP `104.18.54.45`，排除"网络不通导致的假阴性"）

即：**R2 桶当前没有任何公开入口**，无法绕过 Worker 直连。另全仓 grep `r2.dev` 只命中文档说明，代码里无任何地方引用桶的公开地址 → 关闭状态不影响 `play.limao.site`。

**❗为什么当初找不到"关闭口"（界面陷阱，值得记住）**：R2 的 Public access 在**关闭状态**下，界面给的是一个**动作按钮**「**Allow Access**」（语义是"允许访问"，点了才会开），而**不是一个可以关掉的开关** —— 于是找「Disable / 关闭」按钮自然找不到，还容易误以为"Allow Access"是当前状态说明。要开的时候反而需要输入桶名二次确认。

**正确路径**（用于以后复核）：Cloudflare dashboard → 左侧 **R2** → 点桶名 `myself-web-game` → **Settings** 标签 → **Public access** 区块：

- **R2.dev subdomain**（新版标题叫 *Public Development URL*）→ 当前**未启用**，那个「Allow Access」按钮是**开启**动作，**别点**；
- **Custom Domains** → 当前**为空**，**不要连域名**（连上才是真正的公开入口）。

### 🧹 历史部署清理：删掉 117 个旧部署（2026-09-13）

**问题定性（本轮实测）**：Cloudflare Pages 的**每次成功构建都会留下一个永久 URL**（`https://<短ID>.myself-web-3w8.pages.dev`），新部署不会让旧 URL 下线。`cb650d6` 删除 `functions/` 只堵住了生产站，**115 个历史部署 URL 上的 `/games/<任意路径>` 仍在返回 `LIST-ALL count=9`**（R2 桶对象清单）。同时纠正一条旧结论：Pages 项目名是 `myself-web`，真实地址 **`myself-web-3w8.pages.dev`** —— 之前探测的 `myself-web.pages.dev` 是别人的项目，所以才被迫判成"风险低"，实际风险已确认。

**执行方式（可复现）**：

1. **判定**：对每个部署的 `commit_hash`，用本地 git 查 `git ls-tree -r --name-only <sha>` 是否含 `functions/*` —— 比 API 的 `uses_functions` 更准（**117 vs 115**）
2. **保护名单**：带 `www.limao.site` 别名的部署 + 最新部署（`e93ae02f`），绝不删
3. **先试删 1 个**（`d4453481`）验证接口行为：`DELETE /accounts/<id>/pages/projects/myself-web/deployments/<id>` → HTTP 200，该 URL 立刻由 `200 + LIST-ALL` 变为 **404**
4. **批量删除 116 个** → 全部 200，**0 失败**
5. **复核**：`total_count` **134 → 17**；剩余 17 个部署逐个请求 `/games/probe-test` → 含 `LIST-ALL` 的 = **0** ✅

**⚠️ 新坑（重要）：删除部署记录 ≠ 该 URL 立刻下线**

抽样复验 4 个已删 URL：`d4453481` → 404 ✅、`f74306b5` → 404 ✅，但 **`92e106ed` 与 `c5e2790d` 仍返回 200 + `LIST-ALL`**。已排除的两种解释：

- **不是缓存**：请求**从未访问过的全新路径**（`/games/never-probed-before`）与**带随机查询串**的 URL，同样返回泄露内容；响应头无 `cf-cache-status` / `Age` / `Expires` → 是边缘上**仍在执行旧 Function**
- **不是通配兜底**：随机不存在的子域返回「Deployment Not Found」；两个 ID 在 API 里均已 `does not exist`（记录确实删掉了）
- 两个时间点（21:44 / 21:47）复测均仍泄露，非传播延迟

**结论**：删部署能大幅减少暴露面，但**不能保证关死**。要彻底关，需在 `*.myself-web-3w8.pages.dev` 上加 **Cloudflare Access**（Zero Trust，免费版够用），或找 Cloudflare 支持。**已列入未处理项。**

**清理未影响任何正常入口（实测）**：`www.limao.site` → 200；`www.limao.site/games/*` → 404；`play.limao.site` → 200；`myself-web-3w8.pages.dev` → 200。

**顺带查到的项目设置**：

- `preview_deployment_setting: "all"`、`preview_branch_includes: ["*"]` → **推任何分支都会生成公开预览部署**（目前只推 main，故暂无预览部署）
- 项目级 `deployment_configs.production.r2_buckets` 仍挂着 `MY_GAME_BUCKET` → `myself-web-game`，但 `functions/` 已整体删除、生产部署 `uses_functions: false`，**该绑定当前无使用者**
- wrangler 的 OAuth token **读不到 zone 级设置**（`always_use_https` / `rulesets` / `pagerules` 全返回 `Authentication error`），也读不到 `audit_logs` → 涉及 zone 设置的事只能靠面板或用户告知

### 🌐 HTTP / HTTPS 现状（2026-09-13 实测）

| 地址 | 实测行为 |
|---|---|
| `http://www.limao.site/` | **301 → https**（1 次跳转，最终 200）✅ |
| `http://play.limao.site/` | **不跳转，明文 200** ⚠️ —— 且 http 下 Godot **起不来**（非 secure context → 无 `SharedArrayBuffer`）|
| `https://limao.site/`（裸域） | **000** —— 裸域**没有任何 DNS 记录**，访问直接连接失败（不是 404、不是跳转）|

`www` 会跳、`play` 不会的原因**未能从 API 查明**（token 无 zone 设置读权限）。两个候选：**(A)** Always Use HTTPS 已开、但 Workers 自定义域不吃该规则；**(B)** 它是关的，www 的 301 来自只针对 www 的 Redirect Rule / Page Rule。**待用户到面板确认**（SSL/TLS → Edge Certificates → Always Use HTTPS；Rules → Redirect Rules / Page Rules）。**已列入未处理项。**

**溯源补测（同日，用户已确认 Always Use HTTPS = Off，故候选 (A) 被排除）**：

| 请求 | 实测 |
|---|---|
| `http://www.limao.site/` | 301，`Location` 保留路径与查询串 |
| `http://www.limao.site/docs/bg3/` | 301 → `https://www.limao.site/docs/bg3/` |
| `http://www.limao.site/this-does-not-exist-98765/`（**不存在的路径**） | **仍然 301**（对照 https 下同路径为 404） |
| `http://play.limao.site/nonexistent-123` | **404，无跳转** |

即：www 的跳转是**无差别**的（连不存在的路径都跳）→ 发生在**到达源站之前**的边缘层，不是 Pages/Worker 的行为。状态码 301、`cf-cache-status: DYNAMIC`、无 Pages 特征头。**嫌疑集中在"只作用于 www 的 Redirect Rule 或旧版 Page Rule"**，其次可能是 Pages 自定义域自身行为 —— 待用户在 **规则 → 重定向规则 / 页面规则** 里确认（截图里用户看到的「规则 → 概述」只是**模板页**，不显示已有规则）。**该溯源不影响修法**：直接打开 Always Use HTTPS 即可覆盖 play。

**✅ 处置结果：Always Use HTTPS 已开启（2026-09-13，用户操作，纯面板开关、无需重新部署）**

| 请求 | 开启前 | 开启后 |
|---|---|---|
| `http://www.limao.site/` | 301 | 301（不变） |
| `http://www.limao.site/docs/bg3/` | 301 | 301（路径保留） |
| `http://play.limao.site/` | **200 明文** | **301 → https** ✅ |
| `http://play.limao.site/nonexistent-123` | 404 | **301**（无差别跳转，路径原样保留） |
| `http://play.limao.site/<入口 js>` | 200 明文 | **301** ✅ |
| `http://limao.site/`（裸域） | 000 | **000**（无 DNS 记录，与 HTTPS 开关无关） |

跟随跳转实测：`http://play.limao.site/` → 最终 `https://play.limao.site/`，**1 次跳转、最终 200**。

**https 侧未受任何影响**：`www` 200、`play` 200（含 `frame-ancestors`）、入口 js 200、`www/games/probe-test` 404。

**真实浏览器复验**：① 首页点「开始试玩」→ iframe 内 canvas 998×560 正常渲染；② **直接在地址栏输入 `http://play.limao.site/` 也会被自动升级到 https 并成功加载游戏** —— 开启前这个入口是"页面能打开、游戏起不来"（http 非 secure context，无 `SharedArrayBuffer`），**现已修复**；③ 控制台仅剩 2 条 Godot 引擎自身报错（`battle_*.ogg` 资源缺失、`remove_child` 时机），与网站无关。

**仍未处理（低优先级）**：裸域 `limao.site` **没有任何 DNS 记录**，访问直接连接失败。要修需先给裸域加一条**代理状态**的 DNS 记录（或把裸域也加成 Pages 自定义域），**然后**才能用面板里的「从根重定向到 WWW」模板让它跳转到 www —— 这两步缺一不可（没有 DNS 记录时，重定向规则根本收不到请求）。
