const { decode, encode } = require('./pngio.cjs');
const fs = require('fs');

// ArMM1998 character.png: 16 半格 = 16 宽 × 32 高的"大格"；
// 竖向 4 排大格：0=down,1=left,2=right,3=up（经典布局，待验证）
// 横向：每排 8 大格位置，但 16px 半格网格显示 pattern: 4满 + 1空 + 3满 + 1空 (前两排)
// 也就是每排 4 个小人（帧）贴在 4.5 大格间距处？先渲染 16x32 切块矩阵。
const img = decode(fs.readFileSync('gfx3/gfx/character.png'));
const S = 3;
const cw = 16, ch = 32; // 大格
const cols = Math.floor(img.width / cw);   // 17
const rows = Math.floor(img.height / ch);  // 8
const W = cols * cw * S, H = rows * ch * S;
const out = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    const sy = (y / S) | 0, sx = (x / S) | 0;
    const si = (sy * img.width + sx) * 4;
    const a = img.data[si + 3] > 16;
    const chk = ((sx >> 3) + (sy >> 3)) & 1;
    out[o] = a ? img.data[si] : chk ? 0x2a : 0x22;
    out[o + 1] = a ? img.data[si + 1] : chk ? 0x2a : 0x22;
    out[o + 2] = a ? img.data[si + 2] : chk ? 0x2a : 0x22;
    out[o + 3] = 255;
    if (x % (cw * S) === 0 || y % (ch * S) === 0) {
      out[o] = 0xff; out[o + 1] = 0x50; out[o + 2] = 0x50;
    }
  }
}
fs.writeFileSync('character_grid32.png', encode({ width: W, height: H, data: out }));
console.log('wrote character_grid32.png', W + 'x' + H, 'cells', cols + 'x' + rows);

// 同时输出：每 16x32 大格的非透明像素计数矩阵，帮助定位帧位置
const counts = [];
for (let r = 0; r < rows; r++) {
  const line = [];
  for (let c = 0; c < cols; c++) {
    let n = 0;
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++)
        if (img.data[((r * ch + y) * img.width + c * cw + x) * 4 + 3] > 16) n++;
    line.push(n);
  }
  counts.push(line);
}
for (const l of counts) console.log(l.map((n) => (n > 40 ? '#' : n > 0 ? '·' : '.')).join(''));
