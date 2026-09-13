# 交接文档 · 2026-09-13 · 安全巡检深化（Worker 加固 + 全站暴露面实测）

> 本文件是**契约**，不是摘要：写"现在是什么状态、下一步做什么、什么不能碰"。
> 新会话开场：把「1–7 节」整体粘给下一个 AI，再补一句本次目标。

---

## 1. 当前目标

维护并打磨**游戏策划求职作品集网站**（[www.limao.site](https://www.limao.site)），为秋招初筛/面试提供可展示的作品入口。
**当前状态：工作树干净；线上已生效（Worker 已 `wrangler deploy` 并复验通过）；但本地 HEAD `a2ed503` 比 `origin/main`（`f1a642e`）领先 2 个 commit —— 用户选择"只 commit 不 push"，尚未推送。push 与否都不影响线上。**

## 2. 已完成（本轮 5 件事）

| 产出 | 文件 / 命令 | 状态 |
|---|---|---|
| ① **Worker 加固**：方法门（非 GET/HEAD → 405 + `Allow`）、畸形编码 500→400、R2 异常→502、补 4 个安全头（**错误响应也带全套**）、HEAD 空体 | `worker/src/index.js` | ✅ commit `4507831`，**已部署生效** |
| ② **关闭 workers.dev 与版本预览 URL**（本次部署曾把两者默认打开） | `worker/wrangler.toml`：`workers_dev = false` + `preview_urls = false` | ✅ commit `4507831`，已部署，API 查证 `enabled:false` |
| ③ 账本：**v2.5 全量记录**（v2.4 六项复验表 / 改动表 / 46 项离线断言 / 部署后线上复验 / 6 条未处理项 / 1 条被推翻的误判 / 注意事项 11–13） | `CHANGES.md` | ✅ commit `4507831` |
| ④ 账号侧三项核实：GitHub 2FA ✅ + Cloudflare 2FA ✅（用户自述已开）、**R2 公开访问实测已关闭**（API `enabled:false` + 无自定义域 + 直连 r2.dev 得 401） | `CHANGES.md` | ✅ commit `a2ed503` |
| ⑤ 部署与实测复验 | `cd worker && npx wrangler deploy`（两次） | ✅ 线上生效版本 `9912d9a7-1298-4925-b511-1e85e18a75d3` |

## 3. 关键文件（下一位 AI 只需读这几个）

- `CHANGES.md` —— 改动账本 + **13 条**开发者注意事项，**改样式/布局前必读**，最新 v2.5 在文件末尾。⚠️ **此文件在公开 GitHub 仓库里，属公开文档，写内容按公开标准写**
- `交接文档/CURRENT.md` —— 本文件，当前状态契约
- `AGENTS.md` —— 工作区硬约束（每会话自动注入，**不要重述**）
- `worker/src/index.js` —— `play.limao.site` 的 Worker 源码；`FRAME_ANCESTORS` 白名单在这里
- `worker/wrangler.toml` —— Worker 部署配置；**`workers_dev` / `preview_urls` 必须保持 `false`**
- `src/styles/global.css` / `src/styles/eb.css` —— 主题变量表，**颜色改动只动变量**
- `src/layouts/Layout.astro` —— 里程计 / 数字滚轮 / 表情气泡 / **reveal 动画（threshold 必须为 0）** 的 JS 全在这里
- `public/_headers` —— Cloudflare Pages 安全头（**故意不含通用 CSP 与 HSTS**，原因见文件内注释）

## 4. 用户画像 / 项目背景（下一位 AI 必须知道）

- 大陆大学生，Godot 独立游戏作者，**正在秋招求职游戏策划**（2027 届），初筛阶段，1–3 个月内会有笔试面试
- 网站用途：**求职作品集** —— 项目经历（Minecraft RPG 地图 / 开放世界世界观 / 可玩 JRPG Demo）、策划文档、游戏经历评述
- 只用 DeepSeek 官方 API（v4.1-flash / v4-flash / v4-pro），**零订阅**；工具是 DSH Web GUI
- 技术栈：**Astro 7 + Tailwind CSS 4**，内容用 Markdown 管理；Node >= 22.12.0
- **两条独立的部署链（关键）**：
  - **主站** = Cloudflare Pages 绑 GitHub 自动构建 —— `push` 到 `main` 后约 2–3 分钟自动部署
  - **`play.limao.site`** = 独立 Cloudflare Worker（名 `fairytale-game`）+ R2 桶 `myself-web-game` —— **必须 `cd worker && npx wrangler deploy`，push 不会更新它**
- **`play.limao.site` 这条自定义域不在 `wrangler.toml` 里**，是 dashboard 侧绑定的（zone `limao.site`）；要查它去 dashboard → Workers → `fairytale-game` → Settings → Domains & Routes
- 账号：Cloudflare = `limao233666@outlook.com`；wrangler 的 OAuth 凭证存在本机 `%APPDATA%\xdg.config\.wrangler\config\default.toml`（**密钥文件，勿提交**）
- 偏好：喜欢先看到"为什么"再执行；**对视觉细节有明确决策权**；喜欢我用**实测**而不是推测回答问题
- ⚠️ **合规红线**：在线笔试 / 面试不要用 AI
- ⚠️ **本机网络状况**：`*.workers.dev` 是 DNS 黑洞（解析到 `103.73.161.52`、443 超时）→ 在国内打不开 ≠ 它没开；`git ls-remote origin` 报 `Connection was reset`（fetch/push 可能需要代理），但 `api.github.com` 可达

## 5. 未完成 / 下一步（按优先级）

1. **用户下一步动作（唯一阻塞项）**：决定是否 `git push`。本地领先 `origin/main` 若干 commit（**以 `git status -sb` 为准**）。push 会触发 Pages 重建，但本轮**没改** `src/` 与 `public/` → **页面内容零变化**；Worker 已独立部署，不受 push 影响。
2. **待用户确认（Cloudflare 控制台）**：`Always Use HTTPS` 到底是开还是关 —— **API 读不到**（wrangler 的 OAuth token 无 zone 设置权限，`/settings/always_use_https`、`/rulesets` 均返回 `Authentication error`）。实测现状：`http://www.limao.site/` **301→https**，`http://play.limao.site/` **不跳转、明文 200**（且 http 下 Godot 起不来：非 secure context → 无 `SharedArrayBuffer`），裸域 `limao.site` **无任何 DNS 记录、直接打不开**。看两处即可定位：SSL/TLS → Edge Certificates → Always Use HTTPS；Rules → Redirect Rules / Page Rules。
3. **⚠️ Pages 历史部署 URL（已处理大半，仍有残留）**：项目确认为 `myself-web`（`myself-web-3w8.pages.dev`），**117 个含泄露接口的旧部署已删除**（`total_count` 134→17，剩余 17 个实测均无泄露）。但**抽样发现 2 个已删 URL 仍在边缘执行旧 Function**（`92e106ed` / `c5e2790d`，已排除缓存与传播延迟，证据见 `CHANGES.md` v2.5 末尾）→ 要彻底关死需给 `*.myself-web-3w8.pages.dev` 加 **Cloudflare Access**（Zero Trust，免费版够用），或找 Cloudflare 支持。
4. **用户已明确"暂不处理"，勿反复提**：HSTS（`public/_headers` 里那句"Cloudflare 已默认下发 HSTS"**是错的**，HSTS 是 SSL/TLS → Edge Certificates 里的手动开关）、`public/_routes.json` 清理（已成历史遗留，规则失去对象）、简历 PDF 元数据清理（`/Author = u-3083659`、`/Creator = WPS 文字`）
5. **待内容决策**：项目卡封面 `object-fit: cover` 会裁掉童话冒险标题画面边缘 —— 需提供 16:9 封面图后替换（见 `CHANGES.md` 注意事项 9）
6. **已问过且用户明确选择"先不做"**：`robots.txt` / `sitemap.xml`（主路径是 HR 直接点链接）、`.gitignore` 中文注释乱码、首页 2 处 `alt=""`（已确认为合法写法，**勿改**）
7. **背景信息（无需处理）**：Cloudflare 免费版 Web Analytics 的零星境外访问，已定性为混合真人浏览 + 机器噪音，5 条 Wordpress 漏洞扫描被托管 WAF 全部拦截，用户决定不追查

### 副本说明（**不是风险，勿再提议废弃**）

- `D:\WORK\求职\个人网站搭建（改进）` = 用户交给**其他 AI 做改造的实验副本**（同一 git 仓库旧 HEAD，另有未提交改动）。允许与主仓库并存；用户要求「读一下改进版里某个部件的改动」时，把副本实现**拿回主仓库复用**（复制代码/思路，不是合并 git 历史）。**主仓库是唯一发布源。**

## 6. 坑与注意事项

- ⚠️ **Worker 部署是独立一步**：`push` 到 `main` 只记录源码，线上 Worker 不变，必须 `cd worker && npx wrangler deploy`。且它需要一个**本机已存在的 wrangler 凭证**，非交互环境下没有凭证会直接报错要 `CLOUDFLARE_API_TOKEN`（本次是走 `npx wrangler login` 浏览器 OAuth 才拿到的；中途被杀掉的登录进程会留下旧标签页，导致 `OAuth error: request_forbidden / CSRF value does not match`——重开一次即可）。
- ⚠️ **`wrangler.toml` 里不显式写 `workers_dev`，默认值会随账号状态变化**：2026-09-02 那次默认**停用**，2026-09-13 那次默认**启用**，于是 workers.dev 与版本预览 URL 被一起打开（绕过 zone 规则 + 历史版本可被访问）。**已在配置里显式写死 `false`，别删这两行。**
- ⚠️ **Worker 的 `frame-ancestors` 必须包含 `https://www.limao.site`，且绝不能是 `'none'`**：首页试玩是跨域 iframe（父页 www、子帧 play），漏写 www 或写 `'none'` 都会让试玩直接打不开。白名单在 `worker/src/index.js` 的 `FRAME_ANCESTORS`。同理 **`decodeURIComponent(url.pathname)` 必须包 `try/catch`**（畸形 `%FF` 类编码会抛 URIError → Cloudflare `error code: 1101` 500）。
- ⚠️ **绝对不要给主站加 `Cross-Origin-Embedder-Policy`**：会拦掉跨域 iframe，**试玩（play.limao.site）会直接打不开**。（注：`play.limao.site` 自己带 `COEP: require-corp` 是 Godot 需要 SharedArrayBuffer，**不影响它被嵌入** —— 父页不设 COEP 即可，已实测线上 canvas 正常渲染。）
- ⚠️ **R2 的 Public access 在"关闭状态"下，界面只给一个「Allow Access」动作按钮，没有可关的开关** —— 别把它当成状态说明去点；确认状态用 API（`GET /accounts/<id>/r2/buckets/myself-web-game/domains/managed`）。
- ⚠️ **`functions/` 目录是 Pages Functions 路由 = 生产环境公开端点**：往里放任何调试代码，**push 后就是线上公开接口**（曾有一个 `functions/games/[[path]].js` 注释写着"诊断"却泄露 R2 桶清单）。以后要加 Function，必须当作**公开 API** 来审查。
- ⚠️ **Pages 每次构建都留下一个永久公开 URL，且"删除部署"≠立即下线**：`https://<短ID>.myself-web-3w8.pages.dev` 的历史快照不会随新部署消失 —— `cb650d6` 删掉 `functions/` 后，**115 个旧部署 URL 上的泄露接口仍在正常工作**；2026-09-13 清理 117 个旧部署后，**抽样仍有 2 个已删 URL 在边缘执行旧 Function**（已排除缓存：全新路径与随机查询串同样中招）。**在本项目里"删代码"≠"下线能力"**（`CHANGES.md` 注意事项 12）。
- ⚠️ **reveal 的 `threshold` 必须是 0**：`Layout.astro` 的 `initReveal()` 若把阈值设成任何 > 0 的百分比，**把整篇长内容包进一个 `.reveal` 的页面（docs 详情页）就会永不触发** → 内容永久 `opacity: 0`（容器高 7000–28000px，12% 远超视口高）。
- ⚠️ **`.eb-odo` 的 `vertical-align` 是语境相关的**：全局 `-0.14em` 面向小字号独立显示；与正文/英文混排处必须单独覆盖（首页 `.home-num .eb-odo: 0.05em`、项目列表 `.project-board__eyebrow .eb-odo: -0.017em`）。**改字号后要重新做像素级校准，不要靠目测**。
- ⚠️ **`.eb-emoji-pop` 定位依赖元素边界**：调用 `window.__ebPop(name, x, y, el)` 时**必须传第 4 个参数（被点击元素）**，否则退回坐标估算、可能压住按钮。
- ⚠️ **颜色改动只动变量**：头部导航走 `.site-header` 变量表（`global.css`），主题差异在 `eb.css` 以变量覆盖；**不要写硬编码色、不要恢复 `!important`**。
- ⚠️ **雪花屏**：`.eb-tv__play` 保持原版裸白三角（用户决策，勿加底托/描边）；噪点压暗由 CSS `.eb-tv__static .eb-cover-warp { opacity:.55 }` 与 JS `drawStatic()` 灰阶 56–208 **两处共同承担**。
- ⚠️ **预览页**：新增设计草稿页要把路由名加进 `astro.config.mjs` 的 `PREVIEW_ROUTES`，否则会发布到生产。
- ⚠️ **移动端 `pre` 不要改成 `overflow: hidden`**：docs 代码块内容宽 440px > 容器 297px，靠 `overflow-x: auto` 横滑；改 hidden 会截断。
- ⚠️ **像素字体**：大号像素字（h1/h2 级）取 12px 整数倍（24/36/48/60/72）；小号 UI 字不受限。
- ⚠️ **`求职素材集/`（548 文件 / 233 MB）在 `.gitignore` 第 30 行，从未进过 git 历史**（全分支文件名扫描 0 命中，GitHub 公开仓库根目录也确认没有）—— 别把它加进版本控制。
- ⚠️ 交接文档必须跟着项目走，**不要建全局共享文件夹**。

## 7. 验收方式

- `npx astro build` → **零报错**，26 页产物，5 个预览页路由不存在（日志会打印「已从生产构建剔除预览页」）
- **Worker 加固（本轮）**：
  - `curl -X POST https://play.limao.site/` → **405** + `Allow: GET, HEAD`
  - `curl https://play.limao.site/%FF` → **400**
  - `curl -sI https://play.limao.site/` → 含 `content-security-policy: frame-ancestors https://www.limao.site ...` + `x-content-type-options: nosniff` + `referrer-policy`
  - **首页点「开始试玩」→ iframe 内 Godot 画面正常渲染**（`frame-ancestors` 是唯一有破坏性的改动，必须实测）
  - `GET /accounts/<id>/workers/scripts/fairytale-game/subdomain` → `enabled:false`（workers.dev 已关）
- **主站安全现状**：`https://www.limao.site/games/<随机字符串>` 应返回 **404**（自定义 404 页），不得返回 `LIST-ALL ...`；首页响应含 `permissions-policy` / `x-frame-options: DENY` / `content-security-policy: frame-ancestors 'none'`
- **长文档可见性**：取 `/docs/world-regions/` 源码应含 `threshold: 0`；或桌面 1440×900 打开该页滚到中部，正文 opacity 应为 1
- 表情定位：点首页底部「不要」→ 遍历页面所有可见 `a`/`button` 做矩形相交检测 → 应为**空数组**
- 视觉改动给可复现步骤（桌面 1440px / 移动 390px，`npm run dev` → localhost:4321）

## 8. 会话元信息（归档记录）

| 项 | 值 |
|---|---|
| 会话 ID | `本次会话（用户可在 DSH GUI 里查看）` |
| 模型 | deepseek-v4.1-flash-expires-on-0910 |
| 步数 / 平均上下文 | 约 60 步；上下文已超 150K（中途做过一次压缩） |
| 成本 | 未统计 |
| 归档时间 | 2026-09-13 21:35 |

## 9. 下一步：新会话里贴什么

**第一步——贴这段开场：**

```
【本次目标】<你这次想做什么>

先读 交接文档/CURRENT.md，复述「当前目标 / 下一步 / 什么不能碰」三点，我确认后再动手。
```

**第二步——把本文件的第 1–7 节整体附在后面**（第 8、9 节是元信息与操作说明，不用贴）。
