/** 把日期格式化成 YYYY.MM.DD（全站统一用点分隔，与「周期 2026.08.20~…」等手写字段一致） */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/**
 * 项目时间口径（首页任务日志 / 项目卡通用）：
 * 跨年项目显示区间「2019–2022」，同年（或缺 start）退回「2026.06」月份格式。
 * 之前两处口径不一致（列表显示 start 年份、卡片显示 date 年份），观感像数据错了。
 */
export function formatPeriod(start?: Date, date?: Date): string {
  const end = date ? new Date(date) : null;
  const begin = start ? new Date(start) : null;
  if (end && begin && begin.getFullYear() !== end.getFullYear()) {
    return `${begin.getFullYear()}–${end.getFullYear()}`;
  }
  const d = end ?? begin;
  if (!d) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}