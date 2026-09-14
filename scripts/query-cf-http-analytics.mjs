#!/usr/bin/env node
/**
 * 用 Cloudflare GraphQL Analytics API 拉「服务器侧」HTTP 明细，回答：
 *   「到底是谁在爬我的站」——按 ASN / User-Agent / 路径 / 国家聚合。
 *
 * ══════════════════════════════════════════════════════════════════════════
 * 为什么不能靠 scripts/view-visits.mjs 回答这个问题
 *   /hit 由浏览器 sendBeacon 上报 = **客户端**脚本。绝大多数爬虫**不执行 JS**，
 *   所以它们永远不会出现在 analytics/ 里。看访问记录只能看到"执行了 JS 的访客"。
 *   要回答"谁在爬"，必须看 Cloudflare 边缘的服务器侧日志 —— 就是这个脚本。
 *
 * 为什么不用 Cloudflare Web Analytics 面板
 *   它的维度只有 Country/Host/Path/Referer/Device/Browser/OS/Site/Exclude Bots/
 *   Navigation type —— **没有 ASN、没有 User-Agent**，无法定位到具体爬虫。
 *
 * ══════════════════════════════════════════════════════════════════════════
 * 用法（需要一次性准备一个 API Token，见下方"准备 Token"）
 *
 *   node scripts/query-cf-http-analytics.mjs                      # 最近 7 天
 *   node scripts/query-cf-http-analytics.mjs --days 3
 *   node scripts/query-cf-http-analytics.mjs --host www.limao.site
 *   node scripts/query-cf-http-analytics.mjs --json               # 原始 JSON
 *   node scripts/query-cf-http-analytics.mjs --raw                # 打印 GraphQL 语句
 *   node scripts/query-cf-http-analytics.mjs --uafull             # 不截断 UA
 *
 * 准备 Token（免费，约 2 分钟）：
 *   1. https://dash.cloudflare.com/profile/api-tokens
 *   2. Create Token → 用模板「Read analytics」；或自定义权限
 *      Account → Account Analytics → Read
 *      Zone    → Analytics          → Read
 *   3. 拿到 token 后，任选一种方式提供：
 *        · 环境变量：$env:CF_API_TOKEN = "..."   （PowerShell）
 *        · 或写到项目根目录 .cf-token 文件里（该文件已在 .gitignore 中，勿提交）
 *
 * 需要 zone id 时同理：$env:CF_ZONE_ID = "..."  或 .cf-zone 文件
 * 找不到 zone id？打开 dash.cloudflare.com → 选中 limao.site → 右下角 Account ID 旁
 * 的 Zone ID；或直接跑本脚本 default 行为（用 account 级查询时不需要 zone id）。
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const has = (n) => args.includes(n);
const val = (n, d) => {
  const i = args.indexOf(n);
  if (i === -1) return d;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : d;
};

const DAYS = Number(val('--days', 7)) || 7;
const HOST = val('--host', null);
const AS_JSON = has('--json');
const RAW_ONLY = has('--raw');
const UA_FULL = has('--uafull');

function readSecret(file, envName) {
  if (process.env[envName]) return process.env[envName].trim();
  const p = path.join(ROOT, file);
  if (existsSync(p)) {
    const t = readFileSync(p, 'utf8').trim();
    if (t) return t.split(/\r?\n/)[0].trim();
  }
  return null;
}

const TOKEN = readSecret('.cf-token', 'CF_API_TOKEN');
const ZONE = readSecret('.cf-zone', 'CF_ZONE_ID');

// ─────────────────────────────────────────────────────────────────────────
// 已知爬虫 UA 特征（来源：WebDecoy Crawler Directory, CC BY 4.0,
// https://webdecoy.com/bots/ —— 该目录同时给出各家"自称被伪造率"）
// 注意：UA 是"自称"，可任意伪造；WebDecoy 实测 45.8% 的自称爬虫请求
// 并不来自它声称的运营方（GPTBot 54.9%、Googlebot 46.5%）。
// 因此下面的判定只能作为"它在自称谁"，不是"它是谁"。
// ─────────────────────────────────────────────────────────────────────────
const BOT_UA = [
  [/GPTBot/i, 'GPTBot（OpenAI 训练爬虫）'],
  [/OAI-SearchBot/i, 'OAI-SearchBot（OpenAI 检索）'],
  [/ChatGPT-User/i, 'ChatGPT-User（用户实时触发抓取）'],
  [/ClaudeBot|anthropic/i, 'ClaudeBot（Anthropic 训练爬虫）'],
  [/PerplexityBot/i, 'PerplexityBot（Perplexity 检索）'],
  [/Googlebot|Google-InspectionTool|Storebot-Google|Google-Extended/i, 'Googlebot（Google 搜索）'],
  [/bingbot|BingPreview|adidxbot/i, 'bingbot（Bing 搜索 / Copilot）'],
  [/Amazonbot/i, 'Amazonbot（Amazon / Alexa）'],
  [/meta-externalagent|facebookexternalhit|meta-externalfetcher/i, 'Meta 爬虫'],
  [/Bytespider/i, 'Bytespider（字节跳动，常被指无视 robots.txt）'],
  [/Applebot/i, 'Applebot（Apple / Siri）'],
  [/YandexBot/i, 'YandexBot'],
  [/Baiduspider/i, 'Baiduspider（百度）'],
  [/Sogou|360Spider|YisouSpider|PetalBot|Bytespider/i, '国内搜索引擎爬虫'],
  [/AhrefsBot|SemrushBot|MJ12bot|DotBot|DataForSeoBot|Barkrowler/i, 'SEO 分析工具（Ahrefs/Semrush 等）'],
  [/python-requests|python-urllib|aiohttp|httpx|Scrapy|Go-http-client|curl\/|Wget|libwww|Java\/|okhttp|axios|node-fetch|undici/i, '脚本/CLI 客户端'],
  [/HeadlessChrome|Puppeteer|Playwright|Selenium|PhantomJS/i, '无头浏览器'],
  [/Let's Encrypt|acme|UptimeRobot|Pingdom|StatusCake|BetterUptime|monitoring/i, '监控/证书探测'],
  [/bot\b|crawler|spider|slurp/i, '其他自称爬虫'],
];

function guessBot(ua) {
  if (!ua) return '（无 UA）';
  for (const [re, name] of BOT_UA) if (re.test(ua)) return name;
  return '未匹配已知特征';
}

/**
 * Worker 侧 /hit 的丢弃规则（必须与 worker/src/index.js 的 SCRIPT_UA_RE 保持一致）。
 * 用于核对"自建日志到底漏掉了什么"——尤其是"像真人却被误杀"的风险。
 */
const WORKER_SCRIPT_UA_RE =
  /headless|lighthouse|bot\b|spider|crawler|scrapy|python-requests|curl\/|wget\/|monitoring|uptime|pingdom|ahrefs|semrush|dataprovider|bytespider|petalbot/i;

/** 模拟 Worker 判定：true = /hit 会静默丢弃（204，不记入 analytics/） */
function wouldDropByHitFilter(ua) {
  if (!ua) return true; // /hit 里 !ua 直接丢弃
  return WORKER_SCRIPT_UA_RE.test(ua);
}

/** 从 UA 里抽浏览器/版本，便于发现"同一旧版本刷屏"这类异常 */
function uaShape(ua) {
  if (!ua) return '-';
  const eng = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : '?';
  const v = (ua.match(/(?:Edg|OPR|Chrome|Firefox|Version)\/(\d+)/) || [])[1] || '';
  const os = /Windows NT/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '?';
  return `${os} / ${eng}${v ? ' ' + v : ''}`;
}

// 时间窗：Cloudflare 的 end 需为整点之后；用 now - (now % 3600) 对齐可减少"部分小时"抖动
const now = new Date();
const endISO = new Date(Math.floor(now.getTime() / 3600000) * 3600000).toISOString();
const startISO = new Date(Date.parse(endISO) - DAYS * 86400000).toISOString();

/**
 * 维度按优先级排列。字段在当前套餐不可用时会被自动剔除后重试
 * （授权错误形如 "does not have access to the field 'xxx'"）。
 * 字段名来自 AccountHttpRequestsAdaptiveGroupsDimensions 的 schema 内省结果。
 */
const DIM_ORDER = [
  'clientRequestHTTPHost',
  'clientAsn',
  'clientASNDescription',
  'userAgent',
  'clientCountryName',
  'userAgent',
  'verifiedBotCategory',
  'clientRequestPath',
];

function buildQuery(dims) {
  const dimStr = dims.map((d) => `        ${d}`).join('\n');
  // GraphQL 同一选择集内 filter 只能出现一次：host 条件必须并进同一个 filter 对象
  const conds = ['datetime_geq: $start', 'datetime_leq: $end'];
  if (HOST) conds.push(`clientRequestHTTPHost: "${HOST}"`);
  return `
query CrawlerBreakdown($accountTag: String!, $start: Time!, $end: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      httpRequestsAdaptiveGroups(
        limit: 10000
        filter: { ${conds.join(', ')} }
        orderBy: [count_DESC]
      ) {
        count
        sum { edgeResponseBytes }
        dimensions {
${dimStr}
        }
      }
    }
  }
}`;
}

// --raw：只打印 GraphQL 语句，不校验凭据，便于自查或贴给别人看
if (RAW_ONLY) {
  console.log('# 字段组 1：UA + botScore');
  console.log(buildQuery({ withBotScore: true, withUa: true }));
  console.log('# 字段组 2：botScore（UA 不可用时）');
  console.log(buildQuery({ withBotScore: true, withUa: false }));
  console.log('# 字段组 3：基础字段（前两组都失败时）');
  console.log(buildQuery({ withBotScore: false, withUa: false }));
  process.exit(0);
}

if (!TOKEN) {
  console.error(`
✗ 没找到 Cloudflare API Token。

  请任选其一：
    1) PowerShell：  $env:CF_API_TOKEN = "你的token"
    2) 或把 token 写进 ${path.join(ROOT, '.cf-token')}（一行，勿提交）

  创建方式：https://dash.cloudflare.com/profile/api-tokens
    Create Token → 模板「Read analytics」（或自定义 Account Analytics:Read）
`);
  process.exit(1);
}

async function gql(query, variables) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

// accountTag：GraphQL 需要它。优先用 zone 反查所属 account，否则要求显式提供
async function resolveAccountTag() {
  if (process.env.CF_ACCOUNT_ID) return process.env.CF_ACCOUNT_ID.trim();
  const p = path.join(ROOT, '.cf-account');
  if (existsSync(p)) {
    const t = readFileSync(p, 'utf8').trim();
    if (t) return t.split(/\r?\n/)[0].trim();
  }
  if (!ZONE) return null;
  const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const j = await r.json().catch(() => null);
  return j?.result?.account?.id || null;
}

const accountTag = await resolveAccountTag();
if (!accountTag) {
  console.error(`
✗ 需要 Account ID（GraphQL 的 accounts(accountTag:) 必须显式传）。

  任选其一：
    · $env:CF_ACCOUNT_ID = "..."   或写进 .cf-account 文件（一行）
    · 或提供 zone id：$env:CF_ZONE_ID = "..." / .cf-zone 文件，脚本会自动反查 account

  在哪找：dash.cloudflare.com → 选择 limao.site → 右侧栏 Account ID / Zone ID。
`);
  process.exit(1);
}

// 逐级降级：字段在当前套餐不可用时**把它剔除后重试**，而不是直接失败
let dims = [...DIM_ORDER];
let groups = null;
let lastErr = '';
const dropped = [];
while (dims.length) {
  const { status, json } = await gql(buildQuery(dims), { accountTag, start: startISO, end: endISO });
  if (status === 200 && !json?.errors?.length) {
    groups = json?.data?.viewer?.accounts?.[0]?.httpRequestsAdaptiveGroups || [];
    break;
  }
  lastErr = JSON.stringify(json?.errors || json || `HTTP ${status}`).slice(0, 400);
  // 从报错里找出被拒绝/不存在的字段名，剔除后重试
  // 注意：Cloudflare 报错里字段名是**全小写**（如 botScore → 'botscore'），必须大小写无关匹配
  const bad = [
    ...new Set([...lastErr.matchAll(/field '([a-zA-Z0-9_]+)'/gi)].map((m) => m[1].toLowerCase())),
  ].flatMap((lower) => dims.filter((d) => d.toLowerCase() === lower));
  if (!bad.length) break;
  dims = dims.filter((d) => !bad.includes(d));
  dropped.push(...bad);
}

if (groups === null) {
  console.error(`\n✗ GraphQL 查询失败\n  ${lastErr}\n`);
  console.error('  常见原因：token 权限不足（需 Account Analytics:Read）、account id 不对、时间窗超出保留期。');
  process.exit(1);
}
if (dropped.length) console.error(`（注意：以下字段在当前套餐不可用，已自动剔除：${dropped.join(', ')}）`);

const rows = groups.map((g) => ({
  count: g.count,
  bytes: g.sum?.edgeResponseBytes ?? 0,
  host: g.dimensions.clientRequestHTTPHost || '',
  asn: g.dimensions.clientAsn ?? null,
  asnName: g.dimensions.clientASNDescription || '',
  country: g.dimensions.clientCountryName || '',
  path: g.dimensions.clientRequestPath || '',
  ua: g.dimensions.userAgent ?? null,
  botScore: g.dimensions.botScore ?? null,
  verifiedBot: g.dimensions.verifiedBotCategory || '',
  ja4: g.dimensions.ja4 || '',
}));

if (AS_JSON) {
  console.log(JSON.stringify({ start: startISO, end: endISO, dims, rows }, null, 2));
  process.exit(0);
}

const total = rows.reduce((s, r) => s + r.count, 0);
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
console.log(`\n时间窗：${startISO}  →  ${endISO}  （${DAYS} 天）`);
console.log(`查询维度：${dims.join(', ')}${HOST ? `   （仅 host=${HOST}）` : ''}`);
console.log(`命中 ${rows.length} 组，合计 ${total} 次请求，回传 ${mb(rows.reduce((s, r) => s + r.bytes, 0))}\n`);

if (!rows.length) {
  console.log('没有数据。可能：时间窗太早（免费版保留期有限）、host 过滤写错、或确实没有流量。\n');
  process.exit(0);
}

const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;
function table(title, map, top = 15) {
  console.log(`【${title}】`);
  for (const [k, n] of [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, top)) {
    console.log(`  ${String(n).padStart(9)}  ${pct(n).padStart(7)}  ${k}`);
  }
  console.log('');
}
function agg(keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r) || '（未知）';
    m.set(k, (m.get(k) || 0) + r.count);
  }
  return m;
}

// 按 host 过滤（默认全站，含主站与 play 子域）
const shown = HOST ? rows.filter((r) => r.host === HOST) : rows;
if (HOST && shown.length !== rows.length) {
  console.log(`（已按 host=${HOST} 过滤：${rows.length} → ${shown.length} 组）\n`);
}
const totalShown = shown.reduce((s, r) => s + r.count, 0);

// ── 核心：ASN 归属（免费版也有，这是定位"谁在爬"最有力的一列）──
console.log('【按 ASN / 运营商】—— 定位"谁在爬"最有力的一列');
const byAsn = new Map();
for (const r of shown) {
  const k = r.asn ? `AS${r.asn}  ${r.asnName || '（无描述）'}` : '（无 ASN）';
  byAsn.set(k, (byAsn.get(k) || 0) + r.count);
}
for (const [k, n] of [...byAsn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${String(n).padStart(9)}  ${pct(n).padStart(7)}  ${k}`);
}
console.log('');

table('按 Host', agg((r) => r.host));
table('按 UA 自称归类（UA 可伪造，只表示"它自称是谁"）', agg((r) => guessBot(r.ua)));
table('按国家', agg((r) => r.country));

const vbot = agg((r) => r.verifiedBot);
if ([...vbot.keys()].some((k) => k !== '（未知）')) {
  table('Cloudflare 已验证爬虫类别（服务器侧判定，可信）', vbot);
}

if (shown.some((r) => r.botScore !== null)) {
  table(
    'Cloudflare botScore 分档（服务器侧判定，比 UA 可靠）',
    agg((r) =>
      r.botScore === null
        ? null
        : r.botScore <= 29
          ? '1–29  极可能机器人'
          : r.botScore <= 69
            ? '30–69 可疑'
            : '70–99 很可能真人'
    )
  );
}

// ── 核对：/hit 的 UA 过滤到底漏掉了什么（重点看"像真人却被误杀"）──
{
  const droppedTotal = shown.filter((r) => wouldDropByHitFilter(r.ua)).reduce((s, r) => s + r.count, 0);
  const keptTotal = totalShown - droppedTotal;
  console.log('【/hit 过滤规则核对】—— 自建日志会丢弃 / 保留 多少服务器侧请求');
  console.log(`  会被丢弃：${droppedTotal}（${pct(droppedTotal)}）    会被保留：${keptTotal}（${pct(keptTotal)}）`);

  // 保留下来但看起来像"完整真实浏览器"的 UA —— 这是自建日志的理论可见量
  const looksReal = (ua) =>
    !!ua &&
    !wouldDropByHitFilter(ua) &&
    /(Chrome|Safari|Firefox|Edg|OPR)\//.test(ua) &&
    /Windows NT|Macintosh|Android|iPhone|iPad|Linux/.test(ua);
  const realish = shown.filter((r) => looksReal(r.ua)).reduce((s, r) => s + r.count, 0);
  console.log(`  其中「像完整真实浏览器」：${realish} 次（${pct(realish)}）—— 这些才是自建日志理论上能看见的量`);

  // ⚠️ 风险项：UA 长得像真实浏览器（含平台串），却会被我们的规则丢弃。
  // 关键是要看清命中的是**哪条规则**：命中 HeadlessChrome 属正确丢弃；
  // 命中 bot/Bot 且 UA 带 "compatible; ...Bot" 说明是**伪装成 Safari 的 AI 爬虫**，同样该丢。
  const falseDrops = shown.filter(
    (r) =>
      r.ua &&
      /(Chrome|Safari|Firefox|Edg|OPR)\//.test(r.ua) &&
      /Windows NT|Macintosh|Android|iPhone|iPad|Linux/.test(r.ua) &&
      wouldDropByHitFilter(r.ua)
  );
  const fdCount = falseDrops.reduce((s, r) => s + r.count, 0);
  console.log(`\n  ⚠️ UA 像浏览器但会被丢弃：${fdCount} 次（需逐条看命中规则，别直接当误杀）`);
  const fdAgg = new Map();
  for (const r of falseDrops) {
    const hit = (r.ua.match(WORKER_SCRIPT_UA_RE) || ['?'])[0];
    const k = `命中「${hit}」  ${String(r.ua).slice(0, 78)}`;
    fdAgg.set(k, (fdAgg.get(k) || 0) + r.count);
  }
  if (fdAgg.size) {
    for (const [k, n] of [...fdAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
      console.log(`      ${String(n).padStart(6)}  ${k}`);
    }
    console.log('      判读：命中 HeadlessChrome/...Bot 属**正确丢弃**；');
    console.log('            只有"规则命中词与爬虫无关"的才是真误杀。');
  } else {
    console.log('      无 —— 没有任何"像真人的 UA"被规则丢弃');
  }
  console.log('');
}

// ── 明细 ───────────────────────────────────────────────────────────────
const cap = (s, n) => (s === null || s === '' ? '-' : s.length > n ? s.slice(0, n - 1) + '…' : s);
const lim = UA_FULL ? 25 : 25;
console.log(`【明细 Top ${lim}】（UA ${UA_FULL ? '完整' : '截断至 78 字'}）`);
console.log('  次数'.padEnd(10) + 'ASN'.padEnd(9) + '国家'.padEnd(5) + '分'.padEnd(5) + 'Host'.padEnd(19) + '路径'.padEnd(24) + 'UA / 自称');
console.log('  ' + '-'.repeat(150));
for (const r of [...shown].sort((a, b) => b.count - a.count).slice(0, lim)) {
  console.log(
    '  ' +
      String(r.count).padEnd(8) +
      (r.asn ? String(r.asn) : '-').padEnd(9) +
      (r.country || '?').padEnd(5) +
      String(r.botScore ?? '-').padEnd(5) +
      cap(r.host, 18).padEnd(19) +
      cap(r.path, 23).padEnd(24) +
      (UA_FULL ? cap(r.ua, 200) : uaShape(r.ua)) +
      (r.verifiedBot ? `  [CF:${r.verifiedBot}]` : '')
  );
}

console.log(`
提示：
  · ASN 描述（clientASNDescription）由 Cloudflare 提供，可直接据此判断"机房/家宽/代理"。
  · botScore / verifiedBotCategory 视套餐可能为 null；整列 null 说明当前套餐无该数据。
  · 「未匹配已知特征」不代表是真人 —— 大量爬虫使用普通浏览器 UA（实测伪造率约 45.8%）。
  · 想独立核对某个 ASN：curl -s https://ipinfo.io/ASxxxxx/json （免费无 key）。
  · 本条命令的结论若与 view-visits.mjs 不一致是正常的：后者只看"执行了 JS 的访客"。
`);
