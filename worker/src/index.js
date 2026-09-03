// 童话冒险 DEMO 静态托管 Worker（play.limao.site）
// 从 R2 桶 myself-web-game 的 games/fairytale/ 目录下提供 Godot Web 导出文件。
// COOP/COEP 保证跨域隔离（SharedArrayBuffer / Godot 音频需要），与 Cloudflare 静态托管同源。

const PREFIX = 'games/fairytale/';
// Godot Web 导出的实际入口文件名（HTML 内硬编码引用同名 js/wasm/pck）
const ENTRY = '童话冒险web试玩.html';

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // pathname 是百分号编码形式，需解码成 UTF-8 才能匹配 R2 key（中文文件名）
    let path = decodeURIComponent(url.pathname).replace(/^\/+/, '');

    // 根路径 / 或 /index.html -> 游戏入口
    if (path === '' || path === 'index.html') {
      path = ENTRY;
    }
    // 防目录穿越
    if (path.includes('..')) {
      return new Response('Forbidden', { status: 403 });
    }

    const key = PREFIX + path;
    const object = await env.MY_GAME_BUCKET.get(key);

    if (object === null) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType(path));
    headers.set('Content-Length', String(object.size));
    headers.set('Cache-Control', path === ENTRY ? 'no-cache' : 'public, max-age=31536000, immutable');

    // 跨域隔离：Godot 的 SharedArrayBuffer 与音频 worklet 需要
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

    return new Response(object.body, { headers });
  },
};
