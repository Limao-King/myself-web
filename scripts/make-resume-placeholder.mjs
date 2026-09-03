// 生成一个最小的占位 resume.pdf，让"下载简历"按钮先可用。
// 用法：node scripts/make-resume-placeholder.mjs （生成的 public/resume.pdf 之后会被你的真实简历覆盖）
import { writeFileSync } from 'node:fs';

const objects = [];
objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
objects[3] =
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>';
const stream =
  'BT /F1 22 Tf 72 760 Td (This is a placeholder. Replace public/resume.pdf with your real resume.) Tj ET';
objects[4] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

let pdf = '%PDF-1.4\n';
const offsets = [];
for (let i = 1; i < objects.length; i++) {
  offsets[i] = Buffer.byteLength(pdf, 'utf8');
  pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
}
const xrefStart = Buffer.byteLength(pdf, 'utf8');
pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
for (let i = 1; i < objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

writeFileSync('public/resume.pdf', pdf);
console.log('public/resume.pdf generated');