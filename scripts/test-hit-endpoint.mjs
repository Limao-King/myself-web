// 离线断言：worker/src/index.js 的 /hit 端点 + 既有行为回归
// 用法（项目根目录）：node scripts/test-hit-endpoint.mjs [worker 源码路径]
//   不给参数时默认 ../worker/src/index.js；相对路径按**当前工作目录**解析。
// 特点：完全离线——直接 import Worker 模块并注入桩 R2 桶，不联网、不部署、不产生真实流量。
//       改完 worker/src/index.js 应重跑本脚本。
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const arg = process.argv[2] || path.join('worker', 'src', 'index.js');
const workerPath = path.resolve(process.cwd(), arg);
const mod = await import(pathToFileURL(workerPath).href);
const worker = mod.default;

const BUCKET = 'myself-web-game';
function makeBucket() {
  const puts = [];
  const store = new Map();
  return {
    puts,
    store,
    async get(key) {
      if (!store.has(key)) return null;
      const v = store.get(key);
      return { text: async () => v, size: v.length, body: v };
    },
    async put(key, value) {
      store.set(key, String(value));
      puts.push({ key, value: String(value) });
    },
  };
}

const results = [];
function check(name, cond, extra = '') {
  results.push({ name, ok: !!cond, extra });
}

function linesOf(b) {
  const j = b.puts.filter((p) => p.key.endsWith('.jsonl'));
  return j.length ? j[j.length - 1].value.split('\n').filter(Boolean) : [];
}

async function call(request, env) {
  return worker.fetch(request, env);
}

const ORI = 'https://www.limao.site';
const hitReq = (opts = {}) => {
  const {
    method = 'POST',
    origin = ORI,
    ct = 'text/plain',
    ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36',
    body = JSON.stringify({ path: '/docs/bg3/', ref: 'https://www.zhipin.com/', lang: 'zh-CN', sw: 1920, vw: 1440, tz: 'Asia/Shanghai', device: 'mouse' }),
    country = 'CN', asn = 4134,
  } = opts;
  const headers = {};
  if (origin !== null) headers.origin = origin;
  if (ct !== null) headers['content-type'] = ct;
  if (ua !== null) headers['user-agent'] = ua;
  headers['cf-connecting-ip'] = '203.0.113.9';
  const req = new Request('https://play.limao.site/hit', { method, headers, body: method === 'POST' ? body : undefined });
  Object.defineProperty(req, 'cf', { value: { country, asn, colo: 'SJC' } });
  return req;
};

// ── 1. 正常上报 ──
{
  const b = makeBucket();
  const res = await call(hitReq(), { MY_GAME_BUCKET: b });
  check('POST /hit 合法来源 → 204', res.status === 204, 'got ' + res.status);
  check('CORS 回显 Origin', res.headers.get('access-control-allow-origin') === ORI, String(res.headers.get('access-control-allow-origin')));
  check('无响应体（不回传数据）', (await res.text()) === '', '');
  check('写入 analytics/days/YYYY-MM-DD.jsonl 一个对象', b.puts.length === 1 && /^analytics\/days\/\d{4}-\d{2}-\d{2}\.jsonl$/.test(b.puts[0]?.key || ''), JSON.stringify(b.puts.map((p) => p.key)));
  const ls = linesOf(b);
  check('对象内恰 1 行', ls.length === 1, 'lines=' + ls.length);
  const rec = JSON.parse(ls[0] || '{}');
  check('记录含时间/路径/UA/国家/ASN', !!rec.t && rec.p === '/docs/bg3/' && !!rec.ua && rec.c === 'CN' && rec.asn === 4134, JSON.stringify(rec).slice(0, 120));
  check('记录不含明文 IP', !JSON.stringify(rec).includes('203.0.113.9'), '');
  check('IP 以哈希形式出现（16 位 hex）', /^[0-9a-f]{16}$/.test(rec.ip || ''), rec.ip);
}

// ── 1b. 追加语义：第二条应变成 2 行 ──
{
  const b = makeBucket();
  await call(hitReq(), { MY_GAME_BUCKET: b });
  await call(hitReq({ body: JSON.stringify({ path: '/docs/' }) }), { MY_GAME_BUCKET: b });
  const ls = linesOf(b);
  check('第二次上报 → 同一对象内 2 行（追加）', ls.length === 2, 'lines=' + ls.length);
  check('两行路径各自正确', JSON.parse(ls[0]).p === '/docs/bg3/' && JSON.parse(ls[1]).p === '/docs/', '');
}

// ── 2. 安全门 ──
{
  const b = makeBucket();
  let r = await call(hitReq({ method: 'GET' }), { MY_GAME_BUCKET: b });
  check('GET /hit → 405 + Allow: POST', r.status === 405 && r.headers.get('allow') === 'POST', r.status + ' allow=' + r.headers.get('allow'));
  r = await call(hitReq({ method: 'PUT' }), { MY_GAME_BUCKET: b });
  check('PUT /hit → 405', r.status === 405, String(r.status));
  r = await call(hitReq({ origin: 'https://evil.example' }), { MY_GAME_BUCKET: b });
  check('非白名单 Origin → 403', r.status === 403, String(r.status));
  r = await call(hitReq({ origin: null }), { MY_GAME_BUCKET: b });
  check('无 Origin → 403', r.status === 403, String(r.status));
  check('被拒请求未写入桶', b.puts.length === 0, 'puts=' + b.puts.length);
  r = await call(hitReq({ ct: 'application/x-www-form-urlencoded' }), { MY_GAME_BUCKET: b });
  check('非允许 Content-Type → 415', r.status === 415, String(r.status));
  r = await call(hitReq({ body: 'x'.repeat(2048) }), { MY_GAME_BUCKET: b });
  check('超大载荷 → 413', r.status === 413, String(r.status));
  r = await call(hitReq({ body: 'not-json' }), { MY_GAME_BUCKET: b });
  check('非法 JSON → 400', r.status === 400, String(r.status));
  check('异常载荷均未写入桶', b.puts.length === 0, 'puts=' + b.puts.length);
}

// ── 3. 机器 UA 静默丢弃 ──
for (const ua of ['HeadlessChrome/141.0.0.0', 'python-requests/2.31', 'curl/8.4.0', 'Mozilla/5.0 (compatible; AhrefsBot/7.0)']) {
  const b = makeBucket();
  const r = await call(hitReq({ ua }), { MY_GAME_BUCKET: b });
  check(`机器 UA 不上报但回 204（${ua.slice(0, 24)}）`, r.status === 204 && b.puts.length === 0, r.status + ' puts=' + b.puts.length);
}
{
  const b = makeBucket();
  const r = await call(hitReq({ ua: null }), { MY_GAME_BUCKET: b });
  check('无 UA → 204 且不写入', r.status === 204 && b.puts.length === 0, r.status + ' puts=' + b.puts.length);
}

// ── 5. 当日对象达到字节上限 ──
{
  const b = makeBucket();
  const day = new Date().toISOString().slice(0, 10);
  b.store.set(`analytics/days/${day}.jsonl`, 'x'.repeat(8 * 1024 * 1024 + 1));
  const r = await call(hitReq(), { MY_GAME_BUCKET: b });
  check('当日对象超上限 → 204 且不再追加', r.status === 204 && b.puts.length === 0, r.status + ' puts=' + b.puts.length);
}

// ── 6. 原有游戏托管行为回归 ──
{
  const b = makeBucket();
  const day = 'games/fairytale/童话冒险web试玩.html';
  b.store.set(day, '<html>game</html>');
  let r = await call(new Request('https://play.limao.site/', { method: 'GET' }), { MY_GAME_BUCKET: b });
  check('GET / 仍返回游戏入口 200', r.status === 200, String(r.status));
  check('frame-ancestors 仍含 www（未被破坏）', /frame-ancestors[^;]*https:\/\/www\.limao\.site/.test(r.headers.get('content-security-policy') || ''), r.headers.get('content-security-policy'));
  r = await call(new Request('https://play.limao.site/', { method: 'POST' }), { MY_GAME_BUCKET: b });
  check('POST /（非 /hit）仍 405 + Allow: GET, HEAD', r.status === 405 && r.headers.get('allow') === 'GET, HEAD', r.status + ' allow=' + r.headers.get('allow'));
  r = await call(new Request('https://play.limao.site/%FF', { method: 'GET' }), { MY_GAME_BUCKET: b });
  check('畸形编码仍 400', r.status === 400, String(r.status));
  r = await call(new Request('https://play.limao.site/x..y', { method: 'GET' }), { MY_GAME_BUCKET: b });
  check('目录穿越仍 403', r.status === 403, String(r.status));
  r = await call(new Request('https://play.limao.site/missing.pck', { method: 'GET' }), { MY_GAME_BUCKET: b });
  check('未命中仍 404', r.status === 404, String(r.status));
  r = await call(new Request('https://play.limao.site/', { method: 'HEAD' }), { MY_GAME_BUCKET: b });
  check('HEAD 仍空体 200', r.status === 200 && (await r.text()) === '', String(r.status));
}

// ── 汇总 ──
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.extra && !r.ok ? '   [' + r.extra + ']' : ''}`);
console.log(`\n共 ${results.length} 项，通过 ${results.length - failed.length}，失败 ${failed.length}`);
process.exit(failed.length === 0 ? 0 : 1);
