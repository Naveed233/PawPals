import type { Lang } from '@/lib/i18n';

/**
 * Small date helpers for the event date/time picker. Everything works on LOCAL
 * wall-clock parts, never on parsed ISO strings, so a phone in any time zone
 * shows the day the user tapped. Months are 0-based like Date.
 */
export type LocalParts = { y: number; m: number; d: number; hh: number; mm: number };

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DDTHH:MM" (the <input datetime-local> shape the form stores) → parts. */
export function parseLocal(value: string): LocalParts | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const p = { y: +m[1], m: +m[2] - 1, d: +m[3], hh: +m[4], mm: +m[5] };
  if (p.m > 11 || p.d < 1 || p.d > daysInMonth(p.y, p.m) || p.hh > 23 || p.mm > 59) return null;
  return p;
}

export function toLocal(p: LocalParts): string {
  return `${p.y}-${pad2(p.m + 1)}-${pad2(p.d)}T${pad2(p.hh)}:${pad2(p.mm)}`;
}

export function partsOf(date: Date): LocalParts {
  return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate(), hh: date.getHours(), mm: date.getMinutes() };
}

export const toDate = (p: LocalParts) => new Date(p.y, p.m, p.d, p.hh, p.mm);

export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

/** Comparable day number (ignores the time). */
export const dayKey = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;

export function addMonths(y: number, m: number, delta: number): { y: number; m: number } {
  const t = y * 12 + m + delta;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
}

/**
 * Cells for a Sunday-first month grid: leading blanks (null), then 1…N, then
 * trailing blanks so the length is a multiple of 7.
 */
export function monthGrid(y: number, m: number): (number | null)[] {
  const lead = new Date(y, m, 1).getDay();
  const cells: (number | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth(y, m); d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** The next date (today included) that falls on weekday `dow` (0 = Sunday). */
export function nextWeekday(from: Date, dow: number): Date {
  const out = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  out.setDate(out.getDate() + ((dow - out.getDay() + 7) % 7));
  return out;
}

/** Minutes snapped to the wheel's 5-minute steps (59 → 55, never rolls the hour). */
export const snapMinutes = (mm: number) => Math.min(55, Math.round(mm / 5) * 5);

const JA_DOW = ['日', '月', '火', '水', '木', '金', '土'];
const EN_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const weekdayHeaders = (lang: Lang) => (lang === 'ja' ? JA_DOW : EN_DOW.map((d) => d.slice(0, 2)));

/** 10月26日（日） / Sun 26 Oct */
export function formatDay(lang: Lang, y: number, m: number, d: number): string {
  const dow = new Date(y, m, d).getDay();
  return lang === 'ja' ? `${m + 1}月${d}日（${JA_DOW[dow]}）` : `${EN_DOW[dow]} ${d} ${EN_MON[m]}`;
}

/** 午前9:05 / 9:05 AM — the same 12-hour style the event page uses. */
export function formatTime(lang: Lang, hh: number, mm: number): string {
  const h12 = hh % 12 || 12;
  if (lang === 'ja') return `${hh < 12 ? '午前' : '午後'}${h12}:${pad2(mm)}`;
  return `${h12}:${pad2(mm)} ${hh < 12 ? 'AM' : 'PM'}`;
}

/** 2026年10月 / October 2026 */
export const formatMonth = (lang: Lang, y: number, m: number) =>
  lang === 'ja' ? `${y}年${m + 1}月` : `${EN_MONTH[m]} ${y}`;
