const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./pngio.cjs');
function crop(src, dest, x, y, w, h, scale = 2) {
  const img = decode(fs.readFileSync(src));
  const cw = Math.min(w, img.width - x), chh = Math.min(h, img.height - y);
  const out = { width: cw * scale, height: chh * scale, data: new Uint8Array(cw * chh * scale * scale * 4) };
  for (let yy = 0; yy < chh; yy++) for (let xx = 0; xx < cw; xx++) {
    const si = ((y + yy) * img.width + (x + xx)) * 4;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const di = ((yy * scale + dy) * out.width + xx * scale + dx) * 4;
      out.data[di] = img.data[si]; out.data[di+1] = img.data[si+1]; out.data[di+2] = img.data[si+2]; out.data[di+3] = img.data[si+3];
    }
  }
  fs.writeFileSync(dest, encode(out));
  console.log('wrote', dest, out.width + 'x' + out.height);
}
const d = path.join(__dirname, 'zoomgh');
fs.mkdirSync(d, { recursive: true });
const s = p => path.join(__dirname, 'shots2', p);
// shot1: hero stats block + title
crop(s('game-history-1.png'), path.join(d, 'gh1-stats.png'), 830, 260, 360, 110, 3);
crop(s('game-history-1.png'), path.join(d, 'gh1-hero-left.png'), 230, 160, 620, 200, 2);
crop(s('game-history-1.png'), path.join(d, 'gh1-tags.png'), 210, 670, 640, 50, 3);
crop(s('game-history-1.png'), path.join(d, 'gh1-sec3-head.png'), 210, 770, 1010, 120, 1);
// shot2: left hole + cards + collapsed panel
crop(s('game-history-2.png'), path.join(d, 'gh2-hole.png'), 195, 330, 1040, 370, 1);
crop(s('game-history-2.png'), path.join(d, 'gh2-rightcards.png'), 715, 170, 520, 210, 2);
crop(s('game-history-2.png'), path.join(d, 'gh2-tudou.png'), 210, 390, 520, 130, 2);
crop(s('game-history-2.png'), path.join(d, 'gh2-collapsed.png'), 195, 730, 1040, 90, 1);
// shot3: footer + dock
crop(s('game-history-3.png'), path.join(d, 'gh3-footer.png'), 0, 740, 1456, 160, 1);
crop(s('game-history-3.png'), path.join(d, 'gh3-hole.png'), 195, 330, 1040, 220, 1);
