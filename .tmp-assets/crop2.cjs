const fs = require('fs');
const path = require('path');
const { decode, encode } = require('./pngio.cjs');

function crop(src, dest, x, y, w, h, scale = 2) {
  const img = decode(fs.readFileSync(src));
  const cw = Math.min(w, img.width - x), chh = Math.min(h, img.height - y);
  const out = { width: cw * scale, height: chh * scale, data: new Uint8Array(cw * chh * scale * scale * 4) };
  for (let yy = 0; yy < chh; yy++) {
    for (let xx = 0; xx < cw; xx++) {
      const si = ((y + yy) * img.width + (x + xx)) * 4;
      const r = img.data[si], g = img.data[si + 1], b = img.data[si + 2], a = img.data[si + 3];
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const di = ((yy * scale + dy) * out.width + xx * scale + dx) * 4;
          out.data[di] = r; out.data[di + 1] = g; out.data[di + 2] = b; out.data[di + 3] = a;
        }
      }
    }
  }
  fs.writeFileSync(dest, encode(out));
  console.log('wrote', dest, out.width + 'x' + out.height);
}

const d = path.join(__dirname, 'zoom2');
fs.mkdirSync(d, { recursive: true });
const s1 = path.join(__dirname, 'shots2', 'project-ft-1.png');
const s2 = path.join(__dirname, 'shots2', 'project-ft-2.png');
const s3 = path.join(__dirname, 'shots2', 'project-ft-3.png');

crop(s1, path.join(d, 'btns.png'), 210, 430, 700, 120, 2);
crop(s1, path.join(d, 'infoblock.png'), 680, 280, 560, 160, 2);
crop(s2, path.join(d, 'strip2.png'), 150, 0, 640, 30, 3);
crop(s2, path.join(d, 'thumbs.png'), 195, 250, 1040, 95, 1);
crop(s3, path.join(d, 'strip3.png'), 150, 0, 640, 30, 3);
crop(s3, path.join(d, 'flow.png'), 196, 470, 1040, 430, 1);
