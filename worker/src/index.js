// 童话冒险 DEMO 静态托管 Worker（play.limao.site）
// 从 R2 桶 myself-web-game 的 games/fairytale/ 目录下提供 Godot Web 导出文件。
// COOP/COEP 保证跨域隔离（SharedArrayBuffer / Godot 音频需要），与 Cloudflare 静态托管同源。
//
// ⚠️ 安全加固约定（2026-09-13 安全巡检，详见 CHANGES.md v2.5）：
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

export default {
  async fetch(request, env) {
    const method = request.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      const headers = securityHeaders();
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      headers.set('Allow', 'GET, HEAD');
      return new Response('Method Not Allowed', { status: 405, headers });
    }

    const url = new URL(request.url);
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
