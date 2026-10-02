import { DAILY_PUZZLES } from '../data/puzzles';
import { PuzzleDefinition } from '../engine/types';

export function getTodayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDailyPuzzle(targetDate: Date = new Date()): PuzzleDefinition | undefined {
  const today = getTodayDateString(targetDate);
  const released = DAILY_PUZZLES.filter(p => p.date <= today);
  return released.at(-1) ?? (import.meta.env.DEV ? DAILY_PUZZLES[0] : undefined);
}

export function formatGameDate(dateStr: string, lang: 'en' | 'zh'): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (lang === 'zh') {
    return `${year} 年 ${month} 月 ${day} 日`;
  }

  // English format e.g. "October 1st, 2026"
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const mName = monthNames[date.getMonth()];
  const d = date.getDate();
  const nth = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `${mName} ${d}${nth(d)}, ${year}`;
}
