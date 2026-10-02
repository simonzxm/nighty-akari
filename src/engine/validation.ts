import type { PuzzleInput } from './types';

/** Validates the one-character-per-cell format and the 1-indexed permanent seed. */
export function validatePuzzleInput(value: unknown): asserts value is PuzzleInput {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('Puzzle input must be an object');
  }

  const { rows, seed } = value as Record<string, unknown>;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new TypeError('Puzzle rows must be a nonempty array');
  }
  if (typeof rows[0] !== 'string' || rows[0].length === 0) {
    throw new TypeError('Puzzle rows must contain nonempty strings');
  }
  const width = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row: unknown = rows[r];
    if (typeof row !== 'string' || row.length !== width) {
      throw new TypeError(`Puzzle row ${r + 1} must have width ${width}`);
    }
    if (/[^.#0-9]/.test(row)) {
      throw new TypeError(`Puzzle row ${r + 1} contains an invalid cell (allowed: . # 0-9)`);
    }
  }

  if (!Array.isArray(seed) || seed.length !== 2 ||
      !Number.isInteger(seed[0]) || !Number.isInteger(seed[1])) {
    throw new TypeError('Puzzle seed must be a pair of integer coordinates');
  }
  const [r, c] = seed as [number, number];
  if (r < 1 || r > rows.length || c < 1 || c > width) {
    throw new RangeError('Puzzle seed is outside the board');
  }
  if (rows[r - 1][c - 1] !== '.') {
    throw new TypeError('Puzzle seed must be on a white cell');
  }
}
