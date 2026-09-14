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

function buildQuery({ withBotScore, withUa, withHost = true }) {
  const dims = ['clientCountryName', 'clientRequestPath', 'clientRefererHost'];
  if (withUa) dims.push('userAgent');
  if (withBotScore) dims.push('botScore');
  const dimStr = dims.map((d) => `        ${d}`).join('\n');
  // 注意：GraphQL 同一选择集里 filter 只能出现一次 —— host 条件必须并进同一个 filter 对象
  const conds = ['datetime_geq: $start', 'datetime_leq: $end'];
  if (HOST && withHost) conds.push(`clientRequestHTTPHost: "${HOST}"`);
  const filterStr = `filter: { ${conds.join(', ')} },`;
  return `
query CrawlerBreakdown($accountTag: String!, $start: Time!, $end: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      httpRequestsAdaptiveGroups(
        limit: 5000
        ${filterStr}
        orderBy: [count_DESC]
      ) {
        count
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

// 逐级降级：先试最全的字段，字段在当前套餐不可用时退化，而不是直接失败
const attempts = [
  { withBotScore: true, withUa: true, label: 'UA + botScore' },
  { withBotScore: true, withUa: false, label: 'botScore' },
  { withBotScore: false, withUa: false, label: '基础字段' },
];

let groups = null;
let usedLabel = '';
let lastErr = '';
for (const a of attempts) {
  const q = buildQuery(a);
  const { status, json } = await gql(q, { accountTag, start: startISO, end: endISO });
  if (status === 200 && !json?.errors?.length) {
    groups = json?.data?.viewer?.accounts?.[0]?.httpRequestsAdaptiveGroups || [];
    usedLabel = a.label;
    break;
  }
  lastErr = JSON.stringify(json?.errors || json || `HTTP ${status}`).slice(0, 400);
}

if (groups === null) {
  console.error(`\n✗ GraphQL 查询失败（已依次尝试 ${attempts.length} 组字段）\n  ${lastErr}\n`);
  console.error('  常见原因：token 权限不足（需 Account Analytics:Read）、account id 不对、时间窗超出保留期。');
  process.exit(1);
}

const rows = groups.map((g) => ({
  count: g.count,
  country: g.dimensions.clientCountryName || '',
  path: g.dimensions.clientRequestPath || '',
  referer: g.dimensions.clientRefererHost || '',
  ua: g.dimensions.userAgent ?? null,
  botScore: g.dimensions.botScore ?? null,
}));

if (AS_JSON) {
  console.log(JSON.stringify({ start: startISO, end: endISO, fields: usedLabel, rows }, null, 2));
  process.exit(0);
}

const total = rows.reduce((s, r) => s + r.count, 0);
console.log(`\n时间窗：${startISO}  →  ${endISO}  （${DAYS} 天）`);
console.log(`字段组：${usedLabel}${HOST ? `   过滤 host=${HOST}` : ''}`);
console.log(`命中 ${rows.length} 组，合计 ${total} 次请求\n`);

if (!rows.length) {
  console.log('没有数据。可能：时间窗太早（免费版保留期有限）、host 过滤写错、或确实没有流量。\n');
  process.exit(0);
}

// ── 汇总 1：按 UA 自称归类 ─────────────────────────────────────────────
const byClass = new Map();
// ── 汇总 2：按国家 ─────────────────────────────────────────────────────
const byCountry = new Map();
for (const r of rows) {
  const k = guessBot(r.ua);
  byClass.set(k, (byClass.get(k) || 0) + r.count);
  byCountry.set(r.country || '?', (byCountry.get(r.country || '?') || 0) + r.count);
}
const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

console.log('【按 UA 自称归类】—— UA 可伪造，仅表示"它自称是谁"');
for (const [k, n] of [...byClass.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(8)}  ${pct(n).padStart(7)}  ${k}`);
}

console.log('\n【按国家】');
for (const [k, n] of [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`  ${String(n).padStart(8)}  ${pct(n).padStart(7)}  ${k}`);
}

if (rows[0].botScore !== null && rows.some((r) => r.botScore !== null)) {
  const byScore = new Map();
  for (const r of rows) {
    const b = r.botScore;
    const band = b === null ? '未知' : b <= 29 ? '1–29 极可能机器人' : b <= 69 ? '30–69 可疑' : '70–99 很可能真人';
    byScore.set(band, (byScore.get(band) || 0) + r.count);
  }
  console.log('\n【Cloudflare botScore 分档】—— 这是服务器侧判定，比 UA 可靠');
  for (const [k, n] of [...byScore.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(8)}  ${pct(n).padStart(7)}  ${k}`);
  }
}

// ── 明细：Top 25，UA 截断 ──────────────────────────────────────────────
const cap = (s, n) => (s === null ? '-' : s.length > n ? s.slice(0, n - 1) + '…' : s);
console.log(`\n【明细 Top 25】（UA ${UA_FULL ? '完整' : '截断至 90 字'}）`);
console.log(
  '  次数'.padEnd(9) + '国家'.padEnd(6) + '分数'.padEnd(6) + '路径'.padEnd(30) + 'UA 形态'.padEnd(22) + '自称'
);
console.log('  ' + '-'.repeat(140));
for (const r of rows.slice(0, 25)) {
  console.log(
    '  ' +
      String(r.count).padEnd(7) +
      (r.country || '?').padEnd(6) +
      String(r.botScore ?? '-').padEnd(6) +
      cap(r.path, 29).padEnd(30) +
      uaShape(r.ua).padEnd(22) +
      guessBot(r.ua)
  );
}

console.log(`
提示：
  · botScore 需要账号具备 Bot Management 相关数据；免费版可能整列为 null，这不影响其它列。
  · 「未匹配已知特征」不代表是真人 —— 大量爬虫使用普通浏览器 UA。
  · 想确认某个 ASN 属于谁：curl -s https://ipinfo.io/ASxxxxx/json （免费无 key）。
  · 本条命令的结论若与 view-visits.mjs 不一致是正常的：后者只看"执行了 JS 的访客"。
`);
