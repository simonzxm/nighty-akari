import { buildBoard } from '../engine/core';
import { validatePuzzleInput } from '../engine/validation';
import { hashPuzzleContent, isPuzzleHash } from '../engine/puzzleHash';
import type { PuzzleDefinition, PuzzleIndexEntry, PuzzleInput } from '../engine/types';

export let PUZZLE_INDEX: PuzzleIndexEntry[] = [];
let indexUrl: string;
const boards = new Map<string, Promise<PuzzleInput>>();

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Puzzle request failed: HTTP ${response.status}`);
  return response.json();
}

/** Load metadata before the game mounts, without fetching or building any boards. */
export async function loadPuzzleIndex(): Promise<void> {
  const url = import.meta.env.DEV ? '/__puzzles/index.json' : import.meta.env.VITE_PUZZLES_URL;
  if (!url) throw new Error('VITE_PUZZLES_URL is required');
  const resolvedUrl = new URL(url, document.baseURI).href;
  const data = await readJson(resolvedUrl);
  if (!Array.isArray(data) || !data.length) throw new Error('Puzzle index must be a nonempty array');
  const index = data.map((value: unknown, position): PuzzleIndexEntry => {
    if (typeof value !== 'object' || value === null) throw new Error(`Invalid puzzle ${position + 1}`);
    const p = value as PuzzleIndexEntry;
    if (p.id !== position + 1 || !isPuzzleHash(p.hash) || typeof p.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
        !Number.isSafeInteger(p.optimalMoves) || p.optimalMoves < 0 ||
        !['easy', 'medium', 'hard'].includes(p.difficulty) ||
        p.file !== `boards/${p.id}.json`) {
      throw new Error(`Invalid puzzle metadata at index ${position}`);
    }
    const date = new Date(`${p.date}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== p.date) {
      throw new Error(`Invalid puzzle date: ${p.date}`);
    }
    return { id: p.id, hash: p.hash, date: p.date, optimalMoves: p.optimalMoves, difficulty: p.difficulty, file: p.file };
  });
  if (index.some((p, i) => i > 0 && p.date <= index[i - 1].date)) {
    throw new Error('Puzzle dates must be strictly increasing');
  }
  indexUrl = resolvedUrl;
  PUZZLE_INDEX = index;
}

/** Reuse successful boards and in-flight requests only within this page session. */
export async function loadPuzzle(entry: PuzzleIndexEntry): Promise<PuzzleDefinition> {
  const url = new URL(entry.file, indexUrl).href;
  const key = `${url}:${entry.hash}`;
  let request = boards.get(key);
  if (!request) {
    request = readJson(url).then(async data => {
      validatePuzzleInput(data);
      const input = { rows: data.rows, seed: data.seed };
      if (await hashPuzzleContent(input) !== entry.hash) {
        throw new Error(`Puzzle ${entry.id} content does not match its index hash`);
      }
      buildBoard({ ...input, id: entry.id });
      return input;
    }).catch(error => {
      if (boards.get(key) === request) boards.delete(key);
      throw error;
    });
    boards.set(key, request);
  }
  const input = await request;
  return { ...input, id: entry.id, hash: entry.hash, date: entry.date, optimalMoves: entry.optimalMoves, difficulty: entry.difficulty };
}
