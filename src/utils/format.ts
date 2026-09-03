/** 把日期格式化成 YYYY.MM.DD（全站统一用点分隔，与「周期 2026.08.20~…」等手写字段一致） */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}