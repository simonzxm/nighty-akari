import { buildBoard } from '../engine/core';
import type { PuzzleDefinition } from '../engine/types';

export let DAILY_PUZZLES: PuzzleDefinition[] = [];

/** Load once before the game mounts. No bundled bank or fallback data. */
export async function loadPuzzles(): Promise<void> {
  const url = import.meta.env.DEV ? '/__puzzles.json' : import.meta.env.VITE_PUZZLES_URL;
  if (!url) throw new Error('VITE_PUZZLES_URL is required');
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Puzzle request failed: HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.length) throw new Error('Puzzle bank must be a nonempty array');
  const puzzles = data.map((value: unknown, index): PuzzleDefinition => {
    if (typeof value !== 'object' || value === null) throw new Error(`Invalid puzzle ${index + 1}`);
    const p = value as PuzzleDefinition;
    if (p.id !== index + 1 || typeof p.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
        !Number.isSafeInteger(p.optimalMoves) || p.optimalMoves < 0 ||
        !['easy', 'medium', 'hard'].includes(p.difficulty)) {
      throw new Error(`Invalid puzzle metadata at index ${index}`);
    }
    const date = new Date(`${p.date}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== p.date) {
      throw new Error(`Invalid puzzle date: ${p.date}`);
    }
    buildBoard(p);
    return p;
  });
  if (puzzles.some((p, i) => i > 0 && p.date <= puzzles[i - 1].date)) {
    throw new Error('Puzzle dates must be strictly increasing');
  }
  DAILY_PUZZLES = puzzles;
}
