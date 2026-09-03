const { decode, encode } = require('./pngio.cjs');
const fs = require('fs');

// ArMM1998 Zelda-like character.png 布局（连通域实测）：
//   4 排 × (4 帧 + 大格)，每帧 ~16x22。排序 = down / left / right / up。
//   每排第 1 帧在 x≈0-15，第 2 帧 x≈32，第 3 帧 x≈64（往往是镜像/重复帧），
//   x≈96-127 是双人组合图，x≈144-207 是 64 宽多格图 —— 只取每排前 4 个标准帧。
// 我们取的帧盒（留 2px 呼吸空间，统一 16x24 画布）：
const frames = {
  down:  [[0, 4, 16, 24], [32, 4, 16, 24], [64, 4, 16, 24], [80, 4, 16, 24]],
  left:  [[0, 36, 16, 24], [32, 36, 16, 24], [64, 36, 16, 24], [80, 36, 16, 24]],
  right: [[0, 67, 16, 24], [32, 67, 16, 24], [64, 67, 16, 24], [80, 67, 16, 24]],
  up:    [[0, 100, 16, 24], [32, 100, 16, 24], [64, 100, 16, 24], [80, 100, 16, 24]],
};
// 调色板映射（源色 → Onett 旅程配色）：
//   皮肤→留、发色→深棕 #5a3a20、帽/衫主色→番茄红 #d85030、裤→深墨 #2a2620
const remap = (r, g, b, a) => {
  if (a <= 16) return [0, 0, 0, 0];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  // 纯白/近白（帽沿高光、白眼）保留
  if (min > 180) return [r, g, b, 255];
  // 皮肤（红色分量明显高于绿蓝，且较亮）
  if (r > 180 && g > 120 && b > 90 && r > b + 30) return [r, g, b, 255];
  // 深轮廓（近黑）保留
  if (lum < 60) return [26, 22, 16, 255];
  // 主体色（绿帽衫为主色调）→ 番茄红系
  if (g >= r && g >= b) {
    if (lum > 150) return [248, 112, 88, 255];  // 亮红（高光）#f87058
    if (lum > 90) return [216, 80, 48, 255];    // 主红 #d85030
    return [138, 42, 24, 255];                   // 暗红 #8a2a18
  }
  // 其余（棕发/靴/金属）压成深褐
  if (lum > 120) return [122, 80, 40, 255];     // 褐 #7a5028
  return [64, 44, 28, 255];                      // 深褐 #402c1c
};

const img = decode(fs.readFileSync('gfx3/gfx/character.png'));

// 生成 sheet：4 排方向 × 4 帧，帧格 16x24
const dirs = ['down', 'left', 'right', 'up'];
const FW = 16, FH = 24;
const sheet = new Uint8Array(FW * 4 * FH * 4 * 4);
for (let d = 0; d < 4; d++) {
  const dir = dirs[d];
  for (let f = 0; f < 4; f++) {
    const [sx, sy, sw, sh] = frames[dir][f];
    for (let y = 0; y < FH; y++) {
      for (let x = 0; x < FW; x++) {
        const sxi = ((sy + y) * img.width + (sx + x)) * 4;
        const src = [img.data[sxi], img.data[sxi + 1], img.data[sxi + 2], img.data[sxi + 3]];
        // 采样时超出源盒即透明
        const inBox = x < sw && y < sh && sx + x < img.width && sy + y < img.height;
        const px = inBox ? remap(...src) : [0, 0, 0, 0];
        const o = ((d * FH + y) * FW * 4 + f * FW + x) * 4;
        sheet[o] = px[0]; sheet[o + 1] = px[1]; sheet[o + 2] = px[2]; sheet[o + 3] = px[3];
      }
    }
  }
}
fs.writeFileSync('walker_sheet.png', encode({ width: FW * 4, height: FH * 4, data: sheet }));
console.log('walker_sheet.png: 64x96 (4 dirs x 4 frames of 16x24)');

// 预览图（6x 放大，棋盘底）
const S = 6;
const W = FW * 4 * S, H = FH * 4 * S;
const prev = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    const si = (((y / S) | 0) * FW * 4 + ((x / S) | 0)) * 4;
    const a = sheet[si + 3] > 16;
    const chk = (((x / S) | 0 >> 3) + ((y / S) | 0 >> 3)) & 1;
    prev[o] = a ? sheet[si] : 0x22; prev[o + 1] = a ? sheet[si + 1] : 0x22; prev[o + 2] = a ? sheet[si + 2] : 0x28; prev[o + 3] = 255;
  }
}
fs.writeFileSync('walker_preview.png', encode({ width: W, height: H, data: prev }));
console.log('walker_preview.png: ' + W + 'x' + H);
