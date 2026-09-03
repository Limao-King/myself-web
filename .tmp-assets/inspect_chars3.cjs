const { decode } = require('./pngio.cjs');
const fs = require('fs');

const img = decode(fs.readFileSync('gfx3/gfx/character.png'));
const { width: W, height: H, data } = img;

// 非透明掩码
const solid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) solid[i] = data[i * 4 + 3] > 16 ? 1 : 0;

// 连通域（4邻接，BFS）
const label = new Int32Array(W * H).fill(-1);
const boxes = [];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!solid[i] || label[i] >= 0) continue;
    const id = boxes.length;
    const q = [i];
    label[i] = id;
    let minX = x, maxX = x, minY = y, maxY = y, n = 0;
    while (q.length) {
      const j = q.pop();
      const jx = j % W, jy = (j / W) | 0;
      n++;
      if (jx < minX) minX = jx; if (jx > maxX) maxX = jx;
      if (jy < minY) minY = jy; if (jy > maxY) maxY = jy;
      const nb = [j - 1, j + 1, j - W, j + W];
      for (const k of nb) {
        if (k < 0 || k >= W * H) continue;
        if ((k % W) === W - 1 && j % W === 0) continue;
        if ((k % W) === 0 && j % W === W - 1) continue;
        if (solid[k] && label[k] < 0) { label[k] = id; q.push(k); }
      }
    }
    boxes.push({ id, minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1, n });
  }
}

// 只看较大的块（>150px），忽略小碎片
const big = boxes.filter((b) => b.n > 150).sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));
console.log('big components:', big.length);
for (const b of big) {
  console.log(`#${b.id} x=[${b.minX},${b.maxX}] y=[${b.minY},${b.maxY}] size=${b.w}x${b.h} px=${b.n}`);
}
