// 智能裁剪 MiSans 子集：只复制"站点实际用到的字符"所命中的 woff2 分片。
// 用法：node scripts/setup-misans.mjs（已挂到 prebuild，Vercel 每次构建自动运行）
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync as ls } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src');
const PACKAGE = join(root, 'node_modules/misans/lib');
const OUT_DIR = join(root, 'public/fonts/misans');
const OUT_CSS = join(root, 'src/styles/misans-fontfaces.css');

// 1) 收集全站用到的字符（src 下所有文本）
function walk(dir, acc = []) {
  for (const e of ls(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(astro|md|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const set = new Set('·•–—…“”‘’〈〉《》【】（）＋－×÷：；，。！？、');
for (const f of walk(SRC)) {
  let t;
  try { t = readFileSync(f, 'utf8'); } catch { continue; }
  for (const ch of t) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x20 && cp !== 0x7f) set.add(cp);
  }
}

// 2) 解析 unicode-range 是否与字符集相交
function intersect(rangeStr, set) {
  const re = /U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?/g;
  const ranges = [];
  let m;
  while ((m = re.exec(rangeStr))) {
    ranges.push([parseInt(m[1], 16), m[2] ? parseInt(m[2], 16) : parseInt(m[1], 16)]);
  }
  for (const cp of set) {
    for (const [s, e] of ranges) if (cp >= s && cp <= e) return true;
  }
  return false;
}

// 3) 处理某字重的 css：保留命中子集并复制文件
//    weightCss: 包里的 css 路径；weightValue: 输出 @font-face 的 font-weight；subdir: 包内的脚本目录
function processWeight(subdir, cssName, weightValue) {
  const cssPath = join(PACKAGE, subdir, cssName);
  const css = readFileSync(cssPath, 'utf8');
  const blocks = css.match(/@font-face\{[^}]*\}/g) || [];
  let out = '';
  for (const rawBlock of blocks) {
    const urlM = rawBlock.match(/url\('([^']+)'\)/);
    const rangeM = rawBlock.match(/unicode-range:([^;}]+)/);
    if (!urlM || !rangeM) continue;
    const fileName = urlM[1];
    const range = rangeM[1];
    const always = subdir === 'Latin'; // latin 全保留
    if (!always && !intersect(range, set)) continue;
    const srcFile = join(PACKAGE, subdir, fileName);
    if (!readdirSync(join(PACKAGE, subdir)).includes(fileName)) continue;
    mkdirSync(OUT_DIR, { recursive: true });
    copyFileSync(srcFile, join(OUT_DIR, fileName));
    out += `@font-face{font-family:"MiSans";font-style:normal;font-weight:${weightValue};font-display:swap;src:url('/fonts/misans/${fileName}') format('woff2');unicode-range:${range}}\n`;
  }
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });
let css = '';
// 400：正文重量（包里 Regular=330 声明，映射成 400）
css += processWeight('Normal', 'MiSans-Regular.min.css', 400);
// 700：粗体（包里 Bold=630，映射成 700）
css += processWeight('Normal', 'MiSans-Bold.min.css', 700);
// Latin（必要时兜底英文/数字/符号）
for (const ln of ['MiSansLatin-Regular.min.css', 'MiSansLatin-Bold.min.css']) {
  try { css += processWeight('Latin', ln, ln.includes('Bold') ? 700 : 400); } catch {}
}

writeFileSync(OUT_CSS, css, 'utf8');
console.log(`[misans] wrote ${OUT_CSS}, ${css.length} bytes, subsets copied to ${OUT_DIR}`);