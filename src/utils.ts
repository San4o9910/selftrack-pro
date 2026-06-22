/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
export const WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

// Helper to format Date target as YYYY-MM-DD
export function ymd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return ymd(new Date());
}

export function shift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return ymd(d);
}

// Compute the consecutive daily streak backwards from today (or from yesterday if today isn't completed)
export function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const s = new Set(dates);
  const c = new Date();
  
  if (!s.has(ymd(c))) {
    c.setDate(c.getDate() - 1);
    if (!s.has(ymd(c))) return 0;
  }
  
  let k = 0;
  while (s.has(ymd(c))) {
    k++;
    c.setDate(c.getDate() - 1);
  }
  return k;
}

// Build a 42-cell array (7 columns x 6 rows) for the grid matching year and month
export interface CalendarCell {
  d: Date;
  cur: boolean; // Is it in the target month?
}

export function calGrid(y: number, m: number): CalendarCell[] {
  const first = new Date(y, m, 1);
  const totalDays = new Date(y, m + 1, 0).getDate();
  
  // Calculate offset (Monday=0, Sunday=6)
  // getDay() is 0 for Sunday, 1 for Monday...
  const rawDay = first.getDay();
  const off = (rawDay + 6) % 7; 
  
  const cells: CalendarCell[] = [];
  
  // Backfill previous month
  const prevMonthTotal = new Date(y, m, 0).getDate();
  for (let i = off - 1; i >= 0; i--) {
    cells.push({
      d: new Date(y, m - 1, prevMonthTotal - i),
      cur: false
    });
  }
  
  // Current month
  for (let i = 1; i <= totalDays; i++) {
    cells.push({
      d: new Date(y, m, i),
      cur: true
    });
  }
  
  // Fill forward next month
  const rem = 42 - cells.length;
  for (let i = 1; i <= rem; i++) {
    cells.push({
      d: new Date(y, m + 1, i),
      cur: false
    });
  }
  
  return cells;
}

// Format Rubles
export function rub(n: number): string {
  return Math.round(n).toLocaleString('ru-RU') + ' ₽';
}

// Map expense categories to their colors
export const PCATS: [string, string][] = [
  ['Продукты', '#1D9E75'],
  ['Кафе и рестораны', '#E5709B'],
  ['Транспорт', '#3B82C4'],
  ['Жильё и ЖКХ', '#C98A2B'],
  ['Здоровье', '#E5534B'],
  ['Одежда и обувь', '#7E5BD0'],
  ['Развлечения', '#E08A2B'],
  ['Другое', '#8A8A86']
];

export function pcolor(catName: string): string {
  const f = PCATS.find(c => c[0] === catName);
  return f ? f[1] : '#8A8A86';
}

// Compute sleep duration in hours from bed 'HH:MM' and wake 'HH:MM'
export function sleepDuration(bed: string, wake: string): number | null {
  if (!bed || !wake) return null;
  const bp = bed.split(':');
  const wp = wake.split(':');
  if (bp.length < 2 || wp.length < 2) return null;
  
  const b = (+bp[0]) * 60 + (+bp[1]);
  const w = (+wp[0]) * 60 + (+wp[1]);
  let diff = w - b;
  if (diff <= 0) diff += 1440; // overnight
  return Math.round(diff / 30) / 2; // snap to nearest 0.5 hour
}
