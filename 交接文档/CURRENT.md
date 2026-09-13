# 交接文档 · 2026-09-13 · bug 巡检修复 + 安全加固

> 本文件是**契约**，不是摘要：写"现在是什么状态、下一步做什么、什么不能碰"。
> 新会话开场：把「1–7 节」整体粘给下一个 AI，再补一句本次目标。

---

## 1. 当前目标

维护并打磨**游戏策划求职作品集网站**（[www.limao.site](https://www.limao.site)），为秋招初筛/面试提供可展示的作品入口。
**当前状态：工作树干净，全部改动已提交并推送（HEAD 见 `git log -1`，本次为 `cb650d6`），本地与远程一致，线上已复核生效。**

## 2. 已完成（本轮 3 件事）

| 产出 | 文件 / 命令 | 状态 |
|---|---|---|
| ① 归档规范同步：HEAD 指针 + 副本用途说明 | `交接文档/CURRENT.md` | ✅ commit `16410db` |
| ② **P0 修复：docs 长文档正文永久隐形**（reveal 阈值 0.12→0；长容器 12% 永远进不了视口，移动端 7/11 篇文档整页空白） | `src/layouts/Layout.astro` | ✅ commit `16410db`，线上已确认 `threshold: 0` |
| ③ **P0 安全加固：删除生产环境信息泄露接口**（`functions/games/[[path]].js` 调试残留，任何人访问 `/games/<任意路径>` 即可列出 R2 桶全部对象名） | 整个 `functions/` 目录删除 | ✅ commit `cb650d6`，线上复核返回 404 |
| ④ 新增安全响应头（nosniff / Referrer-Policy / Permissions-Policy / X-Frame-Options / frame-ancestors） | `public/_headers` | ✅ commit `cb650d6`，线上已生效 |
| ⑤ 记录两轮巡检结论 + 安全加固说明 | `CHANGES.md`（v2.3 + v2.4） | ✅ |

## 3. 关键文件（下一位 AI 只需读这几个）

- `CHANGES.md` —— 改动账本 + 11 条开发者注意事项，**改样式/布局前必读**；最新 v2.4 在文件末尾
- `交接文档/CURRENT.md` —— 本文件，当前状态契约
- `AGENTS.md` —— 工作区硬约束（每会话自动注入，**不要重述**）
- `src/styles/global.css` / `src/styles/eb.css` —— 主题变量表，**颜色改动只动变量**
- `src/layouts/Layout.astro` —— 里程计 / 数字滚轮 / 表情气泡 / **reveal 动画（threshold 必须为 0）** 的 JS 全在这里
- `public/_headers` —— Cloudflare Pages 安全头（**故意不含通用 CSP 与 HSTS**，原因见文件内注释）

## 4. 用户画像 / 项目背景（下一位 AI 必须知道）

- 大陆大学生，Godot 独立游戏作者，**正在秋招求职游戏策划**（2027 届），初筛阶段，1–3 个月内会有笔试面试
- 网站用途：**求职作品集** —— 项目经历（Minecraft RPG 地图 / 开放世界世界观 / 可玩 JRPG Demo）、策划文档、游戏经历评述
- 只用 DeepSeek 官方 API（v4.1-flash / v4-flash / v4-pro），**零订阅**；工具是 DSH Web GUI
- 技术栈：**Astro 7 + Tailwind CSS 4**，内容用 Markdown 管理；Node >= 22.12.0
- **部署链路（已确认）**：主站 = **Cloudflare Pages 绑 GitHub 自动构建**（push 到 `main` 后约 2–3 分钟自动部署）；`play.limao.site` = 独立 Worker + R2 桶 `myself-web-game`；`public/_routes.json` 只把 `/games/*` 交给 Pages Functions
- 偏好：喜欢先看到"为什么"再执行；**对视觉细节有明确决策权**；喜欢我用**实测**而不是推测回答问题
- ⚠️ **合规红线**：在线笔试 / 面试不要用 AI

## 5. 未完成 / 下一步（按优先级）

### ⚠️ 只有用户本人能做（代码侧无法代理）

1. **给 GitHub 账号开 2FA** —— Pages 绑 GitHub 自动部署，**GitHub 账号 = 网站控制权**（最高优先）
2. **给 Cloudflare 账号开 2FA**
3. **检查 R2 桶 `myself-web-game` 是否开了 Public access / r2.dev 子域** —— 若开启，任何人可直连该桶、绕过 Worker 与所有规则，建议关闭
4. **可选**：Cloudflare 控制台给裸域 `limao.site` 加跳转到 www；关闭 Email Protection（邮箱混淆）

### 待内容决策

5. 项目卡封面 `object-fit: cover` 会裁掉童话冒险标题画面边缘 —— 需提供 16:9 封面图后替换（见 `CHANGES.md` 注意事项 9）

### 副本说明（**不是风险，勿再提议废弃**）

- `D:\WORK\求职\个人网站搭建（改进）` = 用户交给**其他 AI 做改造的实验副本**（同一 git 仓库旧 HEAD，另有未提交改动）。允许与主仓库并存；用户要求「读一下改进版里某个部件的改动」时，把副本实现**拿回主仓库复用**（复制代码/思路，不是合并 git 历史）。**主仓库是唯一发布源。**

### 已问过且用户明确选择"先不做"

6. `robots.txt` / `sitemap.xml` 缺失 —— 判断为**不必要**，主路径是 HR 直接点链接而非搜索
7. `.gitignore` 中文注释乱码（编码混淆，不影响规则）
8. 首页 2 处 `alt=""`（`index.astro:34` / `:168`）—— 已确认为「链接内已有等价文本的装饰图」，**合法写法，勿改**

### 背景信息（无需处理）

9. Cloudflare 免费版 Web Analytics 显示零星境外访问（US/HK/CN）。排查结论：**混合了真人浏览（有站内逐层跳转 + Bing 来源）与机器噪音**；防火墙事件里 5 条 Wordpress 漏洞扫描已被托管 WAF 全部拦截。**免费版拿不到访问者 UA/IP 明细，无法进一步定性**。用户决定**不追查**。

## 6. 坑与注意事项

- ⚠️ **reveal 的 `threshold` 必须是 0**：`Layout.astro` 的 `initReveal()` 若把阈值设成任何 > 0 的百分比，**把整篇长内容包进一个 `.reveal` 的页面（docs 详情页）就会永不触发** → 内容永久 `opacity: 0`（容器高 7000–28000px，12% 远超视口高）。加新阈值前先想"容器会不会比视口高"。
- ⚠️ **绝对不要给主站加 `Cross-Origin-Embedder-Policy`**：会拦掉跨域 iframe，**试玩（play.limao.site）会直接打不开**。（注：`play.limao.site` 自己带 `COEP: require-corp` 是 Godot 需要 SharedArrayBuffer，**不影响它被嵌入** —— 父页不设 COEP 即可，已实测线上 canvas 正常渲染。）
- ⚠️ **`functions/` 目录是 Pages Functions 路由 = 生产环境公开端点**：往里放任何调试代码，**push 后就是线上公开接口**（本轮删除的 `functions/games/[[path]].js` 就是此坑，注释写着"诊断"却泄露了 R2 桶清单）。以后要加 Function，必须当作**公开 API** 来审查。
- ⚠️ **`.eb-odo` 的 `vertical-align` 是语境相关的**：全局 `-0.14em` 面向小字号独立显示；与正文/英文混排处必须单独覆盖（首页 `.home-num .eb-odo: 0.05em`、项目列表 `.project-board__eyebrow .eb-odo: -0.017em`）。**改字号后要重新做像素级校准，不要靠目测**。
- ⚠️ **`.eb-emoji-pop` 定位依赖元素边界**：调用 `window.__ebPop(name, x, y, el)` 时**必须传第 4 个参数（被点击元素）**，否则退回坐标估算、可能压住按钮。
- ⚠️ **颜色改动只动变量**：头部导航走 `.site-header` 变量表（`global.css`），主题差异在 `eb.css` 以变量覆盖；**不要写硬编码色、不要恢复 `!important`**。
- ⚠️ **雪花屏**：`.eb-tv__play` 保持原版裸白三角（用户决策，勿加底托/描边）；噪点压暗由 CSS `.eb-tv__static .eb-cover-warp { opacity:.55 }` 与 JS `drawStatic()` 灰阶 56–208 **两处共同承担**。
- ⚠️ **预览页**：新增设计草稿页要把路由名加进 `astro.config.mjs` 的 `PREVIEW_ROUTES`，否则会发布到生产。
- ⚠️ **移动端 `pre` 不要改成 `overflow: hidden`**：docs 代码块内容宽 440px > 容器 297px，靠 `overflow-x: auto` 横滑；改 hidden 会截断。
- ⚠️ **像素字体**：大号像素字（h1/h2 级）取 12px 整数倍（24/36/48/60/72）；小号 UI 字不受限。
- ⚠️ 交接文档必须跟着项目走，**不要建全局共享文件夹**。

## 7. 验收方式

- `npx astro build` → **零报错**，26 页产物，5 个预览页路由不存在（日志会打印「已从生产构建剔除预览页」）
- **长文档可见性**（P0 修复的验收）：取 `/docs/world-regions/` 的源码应含 `threshold: 0`；或桌面 1440×900 打开该页滚到中部，正文 opacity 应为 1
- **信息泄露已关闭**：`https://www.limao.site/games/<随机字符串>` 应返回 **404**（自定义 404 页），不得返回 `LIST-ALL ...`
- **安全头**：`https://www.limao.site/` 响应应含 `permissions-policy` / `x-frame-options: DENY` / `content-security-policy: frame-ancestors 'none'`
- 表情定位：点首页底部「不要」→ 遍历页面所有可见 `a`/`button` 做矩形相交检测 → 应为**空数组**
- 视觉改动给可复现步骤（桌面 1440px / 移动 390px，`npm run dev` → localhost:4321）

## 8. 会话元信息（归档记录）

| 项 | 值 |
|---|---|
| 会话 ID | `本次会话（用户可在 DSH GUI 里查看）` |
| 模型 | deepseek-v4.1-flash-expires-on-0910 |
| 步数 / 平均上下文 | 约 45 步（未精确统计）；上下文约 90K |
| 成本 | 未统计 |
| 归档时间 | 2026-09-13 19:00 |

## 9. 下一步：新会话里贴什么

**第一步——贴这段开场：**

```
【本次目标】<你这次想做什么>

先读 交接文档/CURRENT.md，复述「当前目标 / 下一步 / 什么不能碰」三点，我确认后再动手。
```

**第二步——把本文件的第 1–7 节整体附在后面**（第 8、9 节是元信息与操作说明，不用贴）。
