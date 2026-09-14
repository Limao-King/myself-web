# 交接文档 · 2026-09-14 · 访问记录端点已上线 + 爬虫归因

> 本文件是**契约**，不是摘要：写"现在是什么状态、下一步做什么、什么不能碰"。
> 新会话开场：把「1–7 节」整体粘给下一个 AI，再补一句本次目标。

---

## 1. 当前目标

维护并打磨**游戏策划求职作品集网站**（[www.limao.site](https://www.limao.site)），为秋招初筛/面试提供可展示的作品入口。

**当前状态：全部已上线，工作树干净。**
- 本地 HEAD `61093ef` = `origin/main`，**无未提交改动**
- 访问记录端点 `POST /hit` **已部署生效**（Worker version `9c0990aa-1f9e-4b29-bf64-269cd95fbe0b`）
- 主站前端上报脚本**已随 Pages 构建上线**（2026-09-14 22:29:11 构建完成），线上 HTML 已含 `sendBeacon` 与 `play.limao.site/hit`
- 端到端已实测：真实浏览器访问 → R2 `analytics/days/2026-09-14.jsonl` 出现记录，路径精确（`/`、`/docs/`）

**本轮的核心认知更新（务必先读，它推翻了一个旧结论）**：服务器侧数据显示主站 7 天收到 **19,532 次请求**（此前门面上看到的只有 216 次"浏览量"），其中 **94.3% 未通过 Cloudflare 验证**。**页面浏览量不能代表真人访问量**；这个站的真实流量绝大部分是爬虫与扫描器。

## 2. 已完成（本轮 5 件事）

| 产出 | 文件 / 命令 | 状态 |
|---|---|---|
| ① **文档分离**：`CHANGES.md` 纯化为工程账本（482→238 行，纯删除，无新增正文）；运维/审计内容迁入交接文档 | `CHANGES.md`、`交接文档/2026-09-13-安全巡检与运维实测.md` | ✅ commit `8f7f3c6` |
| ② **访问记录端点上线**：主站 `sendBeacon` → Worker `POST /hit` → R2 `analytics/days/YYYY-MM-DD.jsonl`（一天一对象、行式追加）。**Worker 已部署**，线上 7 项状态码全部与设计一致 | `worker/src/index.js`、`src/layouts/Layout.astro` | ✅ commit `34f7d71`，已部署 + 已 push |
| ③ **手机号暴露面处置**：删除 `site.config.ts` 里**从未被任何模板渲染**的 `phone` 字段（HTML 扫描 0 命中）；简历 PDF 加 `X-Robots-Tag: noindex`。**PDF 里保留手机号**（HR/ATS 需要） | `src/site.config.ts`、`public/_headers` | ✅ commit `34f7d71` |
| ④ **爬虫归因能力**：Cloudflare GraphQL 服务器侧查询脚本（按 UA/国家/路径/host/已验证爬虫聚合）+ `/hit` 过滤规则核对；`view-visits.mjs` 增加列含义图例 | `scripts/query-cf-http-analytics.mjs`（新增）、`scripts/view-visits.mjs` | ✅ commit `61093ef` |
| ⑤ **凭据保护**：`.cf-token` / `.cf-zone` / `.cf-account` 加入 `.gitignore` | `.gitignore` | ✅ `git check-ignore` 实测生效 |

**设计层影响：零。** `Layout.astro` 本轮为**纯新增**（diff 只有 `+` 行）；`src/styles`、`src/components`、`src/pages`、`src/content`、`tailwind.config`、`astro.config` **均未改动**。构建 26 页、零报错。

## 3. 关键文件（下一位 AI 只需读这几个）

- `CHANGES.md` —— **工程改动账本** + 开发者注意事项（已扩到 18 条），**改样式/布局前必读**。⚠️ **两份文档已职责分离**：`CHANGES.md` 只写"改了代码什么"；**运行/部署/安全/账号面**一律写进 `交接文档/`。⚠️ **公开 GitHub 仓库，按公开标准写**
- `交接文档/2026-09-13-安全巡检与运维实测.md` —— 安全巡检 + 部署运维 + 账号面实测 + 相关坑
- `交接文档/CURRENT.md` —— 本文件，**唯一的状态权威**
- `scripts/view-visits.mjs` —— **看"有没有真人来访"**（筛子）。`node scripts/view-visits.mjs [--days N] [--human-only] [--json]`；只依赖 `wrangler r2 object get`。⚠️ **它只能看见"执行了 JS 的访客"**，看不到绝大多数爬虫
- `scripts/query-cf-http-analytics.mjs` —— **看"谁在爬我"**（显微镜）。`node scripts/query-cf-http-analytics.mjs --days 7 [--host H] [--json] [--raw]`；走 GraphQL，字段在套餐不可用时**自动剔除重试**。⚠️ `--raw` 不需要凭据
- `scripts/test-hit-endpoint.mjs` —— `/hit` 离线断言（32 项）；改了 Worker 就跑它，不用部署
- `worker/src/index.js` —— Worker 源码；`FRAME_ANCESTORS` 白名单 + `/hit` 端点都在这里
- `worker/wrangler.toml` —— **`workers_dev` / `preview_urls` 必须保持 `false`**
- `src/layouts/Layout.astro` —— 里程计 / 数字滚轮 / 表情气泡 / reveal 动画（threshold 必须为 0）/ **上报脚本**
- `public/_headers` —— Pages 安全头（**故意不含通用 CSP 与 HSTS**）

## 4. 用户画像 / 项目背景（下一位 AI 必须知道）

- 大陆大学生，Godot 独立游戏作者，**正在秋招求职游戏策划**（2027 届），初筛阶段，1–3 个月内会有笔试面试
- 网站用途：**求职作品集** —— 项目经历（Minecraft RPG 地图 / 开放世界世界观 / 可玩 JRPG Demo）、策划文档、游戏经历评述
- 只用 DeepSeek 官方 API（v4.1-flash / v4-flash / v4-pro），**零订阅**；工具是 DSH Web GUI
- 技术栈：**Astro 7 + Tailwind CSS 4**，内容用 Markdown 管理；Node >= 22.12.0
- **两条独立的部署链（关键）**：
  - **主站** = Cloudflare Pages 绑 GitHub 自动构建 —— `push` 到 `main` 后约 2–3 分钟自动部署
  - **`play.limao.site`** = 独立 Worker（名 `fairytale-game`）+ R2 桶 `myself-web-game` —— **必须 `cd worker && npx wrangler deploy`，push 不会更新它**
- **`play.limao.site` 这条自定义域不在 `wrangler.toml` 里**，是 dashboard 侧绑定的（zone `limao.site`）
- Cloudflare 账号：`limao233666@outlook.com`；**Account ID** = `ab79b65f5b6aeac7ef70a22b274ada07`（**非密钥**）；**zone `limao.site` ID** = `89fd5eca9c2273fa80b944fd4cab9c20`
- 偏好：先看"为什么"再执行；**视觉细节有决策权**；喜欢**实测**而非推测；不喜欢过度仪式感
- ⚠️ **合规红线**：在线笔试 / 面试不要用 AI
- ⚠️ **本机网络状况**：`*.workers.dev` 是 DNS 黑洞（解析到 `103.73.161.52`、443 超时）→ 国内打不开 ≠ 没开；`git ls-remote origin` 报 `Connection was reset`，但 `api.github.com` 可达
- ⚠️ **本机是 cmd（命令提示符），不是 PowerShell**：`$env:` 语法会报"文件名、目录名或卷标语法不正确"。给命令时**默认按 cmd 写**（`set VAR=value`、`echo x>file`），或明确标注两条

## 5. 未完成 / 下一步（按优先级）

1. **⚠️ Pages 历史预览域名仍在被爬（最值得处理的一项）**：7 天内 `myself-web-3w8.pages.dev` 被访问 **1,021 次**，另有 20+ 个哈希子域（`92e106ed`、`c5e2790d`、`d4453481`…）各被访问 2–13 次。**`preview_urls = false` 只挡新预览，管不了旧的**。建议：给 `*.myself-web-3w8.pages.dev` 加 **Cloudflare Access**（Zero Trust，免费版够用），或找 Cloudflare 支持。⚠️ 这与已知的"2 个已删部署仍在执行旧 Function"是**同一根源**，可一并解决
2. **⚠️ 免费套餐拿不到 ASN**：`clientAsn` / `clientASNDescription` 查询被拒（`does not have access`）—— 这是**套餐限制，不是 token 权限问题**。因此"流量属于哪个机房/运营商"这一层**暂时查不到**。替代手段：`curl -s https://ipinfo.io/<ip>/json`（免费无 key），或升级套餐后重跑脚本
3. **裸域 `limao.site` 无任何 DNS 记录**（访问 000 连接失败）。要修需先加一条代理状态 DNS 记录或把裸域加成 Pages 自定义域，**然后**才能用「从根重定向到 WWW」模板
4. **待内容决策**：项目卡封面 `object-fit: cover` 会裁掉童话冒险标题画面边缘 —— 需提供 16:9 封面图后替换（见 `CHANGES.md` 注意事项 9）
5. **用户已明确"暂不处理"，勿反复提**：HSTS（`public/_headers` 里那句"Cloudflare 已默认下发 HSTS"**是错的**）、`public/_routes.json` 清理、简历 PDF 元数据清理
6. **已问过且明确选择"先不做"**：`robots.txt` / `sitemap.xml`（主路径是 HR 直接点链接）、`.gitignore` 中文注释乱码、首页 2 处 `alt=""`（**已确认合法，勿改**）
7. **可选**：给 R2 的 `analytics/` 前缀加生命周期规则（>90 天过期）。**目前未做**；量级一年几 MB，不做也无妨

### 副本说明（**不是风险，勿再提议废弃**）

- `D:\WORK\求职\个人网站搭建（改进）` = 用户交给**其他 AI 做改造的实验副本**（同一 git 仓库旧 HEAD，另有未提交改动）。允许并存；用户要求"读一下改进版里某个部件的改动"时，把副本实现**拿回主仓库复用**（复制代码/思路，不是合并历史）。**主仓库是唯一发布源。**

## 6. 坑与注意事项

- ⚠️ **`/hit` 是客户端 `sendBeacon`，看不到非 JS 爬虫**：它只能回答"有没有执行了 JS 的访客"。**不要把 `view-visits.mjs` 的结果当作爬虫统计**；要归因爬虫必须用 `query-cf-http-analytics.mjs`（服务器侧）。两个数字差三个数量级是正常的，不是 bug
- ⚠️ **`view-visits.mjs` 的「判定」列不是结论**：仅按 UA 猜测，Googlebot/Bingbot 会伪装成普通浏览器 UA 而被判成"疑似真人"。**更可靠的机器信号是"同一 IP 哈希反复出现 ≥5 次"**。哈希按天换盐、跨天不可关联、**不能反查明文 IP**（刻意设计）
- ⚠️ **UA 完全不可作为身份依据**：实测（WebDecoy，CC BY 4.0）**45.8% 的自称爬虫请求并非来自其声称的运营方**（GPTBot 54.9%、Googlebot 46.5%、bingbot 10.8%）。本项目日志中已验证的 AI 爬虫（ClaudeBot 等）**一律伪装成普通 Safari UA**
- ⚠️ **`/hit` 的过滤规则会正确丢弃 40.4% 的服务器侧请求**，其中"UA 像浏览器却被丢"的 688 次经逐条核对**全是货真价实的爬虫**（`HeadlessChrome` / `compatible; ...Bot`），**没有误杀真人**。核对方法已内建在 `query-cf-http-analytics.mjs` 输出里
- ⚠️ **GraphQL 同层 `filter` 只能出现一次**：host 条件必须并进同一个 `filter` 对象
- ⚠️ **Cloudflare 报错里的字段名是全小写**（`botScore` → `'botscore'`），匹配必须大小写无关
- ⚠️ **PowerShell 重定向 `>` 会写 UTF-16+BOM**，`node -e "require('./x.json')"` 会解析失败 —— 用 `cp.execSync` 捕获 stdout 或显式 UTF-8 写文件
- ⚠️ **不要滥用 Cloudflare API Token**：本轮用户曾把 token 明文贴进聊天，已提醒其吊销重建。**今后不要让用户在对话里贴凭据**：让他自己 `set`/写入 `.cf-token`，脚本自行读取
- ⚠️ **`echo x>.cf-account` 是 cmd 语法**（等号两边不能有空格；`set VAR=` 只在当前窗口有效）。用户默认在 cmd 窗口操作
- ⚠️ **文档职责分离（2026-09-14 起）**：`CHANGES.md` = 只记工程改动；`交接文档/` = 状态契约、安全巡检、部署运维、账号面。**别再把运维/交接内容写回 `CHANGES.md`**
- ⚠️ **Worker 部署是独立一步**；OAuth 报 `CSRF value does not match` 时重开一次即可
- ⚠️ **`wrangler.toml` 不显式写 `workers_dev` 时默认值会随账号状态变化**——已写死 `false`，**别删这两行**
- ⚠️ **Worker 的 `frame-ancestors` 必须包含 `https://www.limao.site`，绝不能是 `'none'`**
- ⚠️ **`decodeURIComponent(url.pathname)` 必须包 `try/catch`**（畸形 `%FF` → 1101 500）
- ⚠️ **绝对不要给主站加 COEP**（会拦掉跨域 iframe，试玩打不开）。`play.limao.site` 自己带 `COEP: require-corp` 是 Godot 需要 SharedArrayBuffer，**不影响它被嵌入**
- ⚠️ **R2 Public access 关闭状态下界面只给「Allow Access」动作按钮**，没有可关的开关；确认状态用 API
- ⚠️ **`functions/` 目录是 Pages Functions = 生产公开端点**；**Pages 每次构建都留永久公开 URL，且"删除部署"≠立即下线**
- ⚠️ **reveal 的 `threshold` 必须是 0**（否则 docs 详情页永久 `opacity: 0`）
- ⚠️ **`.eb-odo` 的 `vertical-align` 是语境相关的**；改字号后必须重新像素级校准
- ⚠️ **`.eb-emoji-pop` 定位必须传第 4 个参数**（被点击元素）
- ⚠️ **颜色改动只动变量**（`global.css` / `eb.css`），不要硬编码色
- ⚠️ **雪花屏**：`.eb-tv__play` 保持裸白三角；噪点压暗由 CSS `.eb-tv__static .eb-cover-warp { opacity:.55 }` 与 JS `drawStatic()` 灰阶 56–208 两处共同承担
- ⚠️ **预览页**：新增设计草稿页要把路由名加进 `astro.config.mjs` 的 `PREVIEW_ROUTES`
- ⚠️ **移动端 `pre` 不要改成 `overflow: hidden`**（docs 代码块靠横滑）
- ⚠️ **像素字体**：大号像素字（h1/h2 级）取 12px 整数倍（24/36/48/60/72）
- ⚠️ **`求职素材集/`（548 文件 / 233 MB）在 `.gitignore`，从未进过 git 历史** —— 别加进版本控制
- ⚠️ 交接文档跟着项目走，**不要建全局共享文件夹**

## 7. 验收方式

- `npx astro build` → **零报错**，26 页产物，5 个预览页路由不存在（日志打印「已从生产构建剔除预览页」）
- **访问记录端点（已上线）**：
  - 离线断言：`node scripts/test-hit-endpoint.mjs` → **32 项全通过**
  - 线上状态码：非白名单 Origin → **403**；无 Origin → **403**；机器 UA → **204**；错误 Content-Type → **415**；坏 JSON → **400**；`GET /hit` → **405 + `Allow: POST`**；`POST /` → **405**
  - 端到端：浏览器打开 `https://www.limao.site/` 等 2 秒 → `node scripts/view-visits.mjs --days 1` 应出现该次记录（路径与真实访问一致）
  - 回归：首页点「开始试玩」→ iframe 内 Godot 画面正常渲染
- **爬虫归因（需 `.cf-token` + `.cf-account`）**：`node scripts/query-cf-http-analytics.mjs --days 7` → 应输出「按 ASN / 按 Host / 按 UA 自称 / 按国家 / 已验证爬虫 / botScore 分档 + `/hit` 过滤规则核对」；`--raw` 无需凭据
- **Worker 加固回归**：`curl -X POST https://play.limao.site/` → **405**；`curl https://play.limao.site/%FF` → **400**；`curl -sI https://play.limao.site/` 含 `frame-ancestors https://www.limao.site`
- **主站安全现状**：`https://www.limao.site/games/<随机串>` → **404**；首页响应含 `permissions-policy` / `x-frame-options: DENY` / `frame-ancestors 'none'`（**主站的 `'none'` 是故意的**，别与 Worker 那条混淆）
- **长文档可见性**：`/docs/world-regions/` 源码应含 `threshold: 0`
- **文档纪律**：`grep -n "wrangler" CHANGES.md` 应**仅剩 1 处**（注意事项 11，记录 `wrangler r2 object list` 不存在这一工程约束）；**部署命令、凭据、服务器状态一律不得写进 `CHANGES.md`**。所有文档中**不得出现本机绝对路径 / 用户名 / 凭证目录 / API token 字样**
- 视觉改动给可复现步骤（桌面 1440px / 移动 390px）

## 8. 会话元信息（归档记录）

| 项 | 值 |
|---|---|
| 会话 ID | `session-9d0a6a85-ed0c-431f-9445-85b10743ab1e` |
| 模型 | deepseek-v4.1-flash-expires-on-0910 |
| 步数 / 平均上下文 | 约 80 步；上下文超 150K（中途做过一次压缩） |
| 成本 | 未统计 |
| 归档时间 | 2026-09-14 23:05 |

## 9. 下一步：新会话里贴什么

**第一步——贴这段开场：**

```
【本次目标】<你这次想做什么>

先读 交接文档/CURRENT.md，复述「当前目标 / 下一步 / 什么不能碰」三点，我确认后再动手。
```

**第二步——把本文件的第 1–7 节整体附在后面**（第 8、9 节是元信息与操作说明，不用贴）。

**第三步（可选）——如果要继续做爬虫归因**，再补一句：

```
凭据我已在本机准备好：`.cf-token` 与 `.cf-account` 都在项目根目录（已被 .gitignore 忽略），
直接跑 scripts/query-cf-http-analytics.mjs 即可，不要让我在对话里贴 token。
```
