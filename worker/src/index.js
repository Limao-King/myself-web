// 童话冒险 DEMO 静态托管 Worker（play.limao.site）
// 从 R2 桶 myself-web-game 的 games/fairytale/ 目录下提供 Godot Web 导出文件。
// COOP/COEP 保证跨域隔离（SharedArrayBuffer / Godot 音频需要），与 Cloudflare 静态托管同源。
//
// ⚠️ 安全加固约定（2026-09-13 安全巡检，详见 交接文档/2026-09-13-安全巡检与运维实测.md）：
//   · 只接受 GET / HEAD，其余一律 405（原实现不校验 request.method）
//   · 路径解码失败（畸形 % 编码，如 /%FF）返回 400 —— 原实现会抛 URIError 变成
//     Cloudflare 的 500（error code: 1101），任何人一个畸形请求就能刷错误日志
//   · 所有响应（含 400/403/404/405）都带同一套安全头，错误路径不再"裸奔"
//   · frame-ancestors 只放行主站与本地 dev —— 切勿写 'none'，
//     否则首页 <iframe data-src="https://play.limao.site/"> 试玩会直接打不开

const PREFIX = 'games/fairytale/';
// Godot Web 导出的实际入口文件名（HTML 内硬编码引用同名 js/wasm/pck）
const ENTRY = '童话冒险web试玩.html';

// 允许把本 Worker 嵌进 iframe 的父页面来源：
// 主站 + 本地 dev（Astro dev 起在 localhost:4321，首页 iframe 直连线上 play，不列会被拦）
const FRAME_ANCESTORS = [
  'https://www.limao.site',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
].join(' ');

// ─────────────────────────────────────────────────────────────
// 主站访问记录端点（POST /hit）—— 只写不读，2026-09-14 新增
//
// 目的：Cloudflare Web Analytics 只会给出聚合计数（页浏览量/访问量），
//       看不到「谁来的、什么客户端、什么时候」——本项目实测被爬虫刷到 216 次，
//       却无法据此判断有没有真人（HR）访问。因此自建一个最小记录端点。
//
// 数据落在**同一个** R2 桶的 analytics/ 前缀下，不新增绑定：
//   analytics/days/YYYY-MM-DD.jsonl   当天所有页面加载，**一行一条 JSON**
// 为什么按天聚合而不是一次加载一条对象：`wrangler r2 object list` 在当前版本不存在，
// 逐条对象只能用面板浏览；按天一个对象后，读取退化为一次 `wrangler r2 object get`。
// 记录字段见 hitRecord()。**不存明文 IP**，只存加盐哈希（当日换盐）。
//
// ⚠️ 这是**新的公开写端点**，务必当作公开 API 审查：
//   · 只接受 POST，其余 405；非 /hit 路径不受影响
//   · 校验 Origin 必须是主站（或本地 dev）→ 否则 403
//   · 载荷上限 1 KiB；路径/UA/Referer 均截断，不解析查询串
//   · 命中常见脚本 UA（headless/爬虫/审计工具）**不上报但照常返回 204**
//   · 单日对象有字节上限（MAX_DAY_BYTES），被刷也不会撑爆桶
const HIT_PATH = '/hit';
const ALLOWED_ORIGINS = ['https://www.limao.site', 'http://localhost:4321', 'http://127.0.0.1:4321'];
const MAX_BODY_BYTES = 1024;
// 当日记录对象上限（约 3.5 万条），达到后静默丢弃——被刷也撑不爆桶
const MAX_DAY_BYTES = 8 * 1024 * 1024;
const ANALYTICS_PREFIX = 'analytics/';
// 只排除「明确不是页面加载」的客户端；不猜、不误伤（宁可留下待人工判断）
const SCRIPT_UA_RE = /headless|lighthouse|bot\b|spider|crawler|scrapy|python-requests|curl\/|wget\/|monitoring|uptime|pingdom|ahrefs|semrush|dataprovider|bytespider|petalbot/i;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.pck': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.worklet.js': 'text/javascript; charset=utf-8',
};

function contentType(path) {
  const lower = path.toLowerCase();
  for (const [ext, mime] of Object.entries(MIME)) {
    if (lower.endsWith(ext)) return mime;
  }
  return 'application/octet-stream';
}

/** 每个响应都要带的基础安全头（错误响应同样适用） */
function securityHeaders() {
  const headers = new Headers();
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), serial=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  headers.set('Content-Security-Policy', `frame-ancestors ${FRAME_ANCESTORS}`);
  // 跨域隔离：Godot 的 SharedArrayBuffer 与音频 worklet 需要
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return headers;
}

/** 纯文本错误响应（带安全头） */
function errorResponse(status, message) {
  const headers = securityHeaders();
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  return new Response(message, { status, headers });
}

/** 空白应答（访问记录端点的所有返回都用它，不回传任何数据） */
function emptyResponse(status, origin, extra = {}) {
  const headers = securityHeaders();
  headers.set('Cache-Control', 'no-store');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(null, { status, headers });
}

/** 当日换盐的 IP 哈希（**不存明文 IP**；盐按天变化，无法跨天关联） */
async function ipHash(ip, keyHint) {
  const salt = `limao-visit|${new Date().toISOString().slice(0, 10)}|${keyHint}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '|' + ip));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 组装写入 R2 的记录。字段刻意短，便于本地直接读 */
function hitRecord(payload, request, ipDigest, now) {
  const cf = request.cf || {};
  const header = (n) => (request.headers.get(n) || '').slice(0, 256);
  return {
    t: now.toISOString(),
    p: typeof payload.path === 'string' ? payload.path.slice(0, 200) : '',
    r: typeof payload.ref === 'string' ? payload.ref.slice(0, 256) : '',
    lang: typeof payload.lang === 'string' ? payload.lang.slice(0, 32) : '',
    sw: Number.isFinite(payload.sw) ? payload.sw : null,
    vw: Number.isFinite(payload.vw) ? payload.vw : null,
    tz: typeof payload.tz === 'string' ? payload.tz.slice(0, 64) : '',
    d: typeof payload.device === 'string' ? payload.device.slice(0, 16) : '',
    ua: header('user-agent'),
    c: cf.country || '',
    asn: cf.asn || '',
    colo: cf.colo || '',
    ip: ipDigest,
  };
}

/** 当日记录对象键：analytics/days/YYYY-MM-DD.jsonl（一天一个对象，行式追加） */
function dayKey(day) {
  return `${ANALYTICS_PREFIX}days/${day}.jsonl`;
}

/**
 * 处理 POST /hit：校验 → 写 R2。任何写失败都不向调用方暴露细节。
 *
 * 存储形态 = **一天一个对象、每次加载追加一行 JSON**（JSONL）。
 * 为什么不是"一次加载一个对象"：`wrangler r2 object list` 在当前版本**不存在**
 * （只有 get / put / delete），逐条对象只能靠面板浏览；按天聚合后，读取退化成
 * 一次 `wrangler r2 object get`，命令行就能看。
 * 代价：读-改-写存在竞态（同一毫秒的并发可能丢极少数记录）。本站量级（每天几十到几百次）
 * 完全可接受，且丢了也不影响"判断有没有真人"这个用途。
 */
async function handleHit(request, env, origin) {
  const ctype = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (ctype !== 'text/plain' && ctype !== 'application/json') {
    return emptyResponse(415, origin);
  }
  let text;
  try {
    text = await request.text();
  } catch {
    return emptyResponse(400, origin);
  }
  if (text.length > MAX_BODY_BYTES) return emptyResponse(413, origin);

  let payload;
  try {
    payload = JSON.parse(text || '{}');
  } catch {
    return emptyResponse(400, origin);
  }
  if (!payload || typeof payload !== 'object') return emptyResponse(400, origin);

  const ua = request.headers.get('user-agent') || '';
  // 明确不是页面加载的客户端：不上报，但同样回 204（不必让对方知道被识别）
  if (!ua || SCRIPT_UA_RE.test(ua)) return emptyResponse(204, origin);

  try {
    const bucket = env.MY_GAME_BUCKET;
    if (!bucket) return emptyResponse(503, origin);

    const now = new Date();
    const key = dayKey(now.toISOString().slice(0, 10));

    let prev = '';
    try {
      const obj = await bucket.get(key);
      if (obj && typeof obj.text === 'function') prev = await obj.text();
    } catch {
      // 读不到当空处理：宁可少算，也不因为读失败把这次记录丢掉
    }
    if (prev.length > MAX_DAY_BYTES) return emptyResponse(204, origin); // 当日已达上限，静默丢弃

    const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
    const record = hitRecord(payload, request, await ipHash(ip, ua.slice(0, 24)), now);
    const body = prev + JSON.stringify(record) + '\n';

    await bucket.put(key, body, {
      httpMetadata: { contentType: 'application/x-ndjson; charset=utf-8' },
    });
  } catch {
    // 静默失败：访问记录绝不能让访客看到错误
  }
  return emptyResponse(204, origin);
}

export default {
  async fetch(request, env) {
    const method = request.method.toUpperCase();
    const url = new URL(request.url);

    // ── 主站访问记录端点（只写不读）。必须放在下面的方法门之前 ──
    if (url.pathname === HIT_PATH) {
      if (method !== 'POST') {
        return emptyResponse(405, null, { Allow: 'POST' });
      }
      const origin = request.headers.get('origin') || '';
      if (!ALLOWED_ORIGINS.includes(origin)) {
        return emptyResponse(403, null);
      }
      return handleHit(request, env, origin);
    }

    if (method !== 'GET' && method !== 'HEAD') {
      const headers = securityHeaders();
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      headers.set('Allow', 'GET, HEAD');
      return new Response('Method Not Allowed', { status: 405, headers });
    }

    // pathname 是百分号编码形式，需解码成 UTF-8 才能匹配 R2 key（中文文件名）
    let path;
    try {
      path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    } catch {
      // 畸形百分号编码（/%FF、/%C3%28 等）会抛 URIError —— 接住并回 400，不要冒泡成 500
      return errorResponse(400, 'Bad Request');
    }

    // 根路径 / 或 /index.html -> 游戏入口
    if (path === '' || path === 'index.html') {
      path = ENTRY;
    }
    // 防目录穿越
    if (path.includes('..')) {
      return errorResponse(403, 'Forbidden');
    }

    const key = PREFIX + path;

    let object;
    try {
      object = await env.MY_GAME_BUCKET.get(key);
    } catch {
      // R2 侧异常同样不冒泡成 500，避免运行时错误信息外泄
      return errorResponse(502, 'Bad Gateway');
    }

    if (object === null) {
      return errorResponse(404, 'Not Found');
    }

    const headers = securityHeaders();
    headers.set('Content-Type', contentType(path));
    headers.set('Content-Length', String(object.size));
    headers.set('Cache-Control', path === ENTRY ? 'no-cache' : 'public, max-age=31536000, immutable');

    return new Response(method === 'HEAD' ? null : object.body, { headers });
  },
};
