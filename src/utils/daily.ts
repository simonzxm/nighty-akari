import { DAILY_PUZZLES } from '../data/puzzles';
import { PuzzleDefinition } from '../engine/types';

// Anchor date: 2026-10-01 is Puzzle #1
const ANCHOR_DATE = new Date('2026-10-01T00:00:00');

export function getTodayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns the index of today's puzzle based on days elapsed since anchor.
 */
export function getDailyPuzzleIndex(targetDate: Date = new Date()): number {
  const diffTime = targetDate.getTime() - ANCHOR_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 0;
  return diffDays % DAILY_PUZZLES.length;
}

export function getDailyPuzzle(targetDate: Date = new Date()): PuzzleDefinition {
  const idx = getDailyPuzzleIndex(targetDate);
  return DAILY_PUZZLES[idx];
}

export function getPuzzleByNumber(puzzleNum: number): PuzzleDefinition | undefined {
  return DAILY_PUZZLES.find(p => p.number === puzzleNum);
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
