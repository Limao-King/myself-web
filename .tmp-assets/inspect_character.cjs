const { decode, encode } = require('./pngio.cjs');
const fs = require('fs');

const src = fs.readFileSync('gfx3/gfx/character.png');
const img = decode(src);
console.log('character.png', img.width + 'x' + img.height);

// 按 16px 网格统计非透明单元格数量
const cell = 16;
let nonEmpty = 0, grid = [];
for (let gy = 0; gy < Math.floor(img.height / cell); gy++) {
  let row = '';
  for (let gx = 0; gx < Math.floor(img.width / cell); gx++) {
    let any = false;
    for (let y = 0; y < cell && !any; y++)
      for (let x = 0; x < cell; x++)
        if (img.data[((gy * cell + y) * img.width + gx * cell + x) * 4 + 3] > 16) { any = true; break; }
    row += any ? '#' : '.';
    if (any) nonEmpty++;
  }
  grid.push(row);
}
console.log('non-empty 16px cells:', nonEmpty, 'of', Math.floor(img.width / cell) * Math.floor(img.height / cell));
console.log(grid.join('\n'));

// 渲染 4x 放大 + 网格线图
const S = 4;
const W = img.width * S, H = img.height * S;
const out = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    const sy = (y / S) | 0, sx = (x / S) | 0;
    const si = (sy * img.width + sx) * 4;
    const a = img.data[si + 3] > 16;
    // 棋盘底
    const chk = ((sx >> 3) + (sy >> 3)) & 1;
    out[o] = a ? img.data[si] : chk ? 0x30 : 0x20;
    out[o + 1] = a ? img.data[si + 1] : chk ? 0x30 : 0x20;
    out[o + 2] = a ? img.data[si + 2] : chk ? 0x30 : 0x20;
    out[o + 3] = 255;
    // 网格线（16px 单元格边界）
    if (x % (cell * S) === 0 || y % (cell * S) === 0) {
      out[o] = out[o + 1] = a ? 0xff00 : 0x00; // 深底亮线、亮底暗线
      out[o] = a ? 0xff : 0x00; out[o + 1] = a ? 0x40 : 0x40; out[o + 2] = a ? 0x40 : 0x40;
    }
  }
}
fs.writeFileSync('character_grid.png', encode({ width: W, height: H, data: out }));
console.log('wrote character_grid.png', W + 'x' + H);
