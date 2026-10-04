import { inspectBoard } from '../engine/core';
import { isPuzzleHash } from '../engine/puzzleHash';
import type { BoardModel, PuzzleMetadata } from '../engine/types';

export interface PuzzleRecord {
  hash: string;
  moves: number;
  timeSeconds: number;
}

export interface SavedGameState {
  puzzleId: number;
  hash: string;
  stateHex: string;
  moves: number;
  startTime: number | null;
  historyHex: string[];
}

type PuzzleIdentity = Pick<PuzzleMetadata, 'id' | 'hash'>;
const RECORDS_KEY = 'nighty_akari_records';
const IN_PROGRESS_KEY = 'nighty_akari_in_progress';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is PuzzleRecord {
  return isObject(value) && isPuzzleHash(value.hash) &&
    isNonnegativeInteger(value.moves) && isNonnegativeInteger(value.timeSeconds);
}

function isSavedState(value: unknown): value is SavedGameState {
  return isObject(value) && isPuzzleHash(value.hash) &&
    isNonnegativeInteger(value.puzzleId) && value.puzzleId > 0 &&
    typeof value.stateHex === 'string' && /^0x[0-9a-f]+$/i.test(value.stateHex) &&
    isNonnegativeInteger(value.moves) &&
    (value.startTime === null || (isNonnegativeInteger(value.startTime) && value.startTime > 0)) &&
    (value.moves === 0 || value.startTime !== null) &&
    Array.isArray(value.historyHex) && value.historyHex.length === value.moves &&
    value.historyHex.every(hex => typeof hex === 'string' && /^0x[0-9a-f]+$/i.test(hex));
}

function readStorage(key: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : {};
    return isObject(value) ? value : {};
  } catch {
    return {};
  }
}

function removeSavedState(puzzleId: number): void {
  try {
    const states = readStorage(IN_PROGRESS_KEY);
    if (Object.hasOwn(states, puzzleId)) {
      delete states[puzzleId];
      localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(states));
    }
  } catch (err) {
    console.error('Failed to clear game state:', err);
  }
}

/** Run after the current index and initial board load, before mounting the game. */
export function cleanPuzzleStorage(puzzles: readonly PuzzleIdentity[]): void {
  const hashes = new Map(puzzles.map(puzzle => [String(puzzle.id), puzzle.hash]));
  for (const key of [RECORDS_KEY, IN_PROGRESS_KEY]) {
    try {
      const values = readStorage(key);
      for (const [id, value] of Object.entries(values)) {
        const valid = key === RECORDS_KEY
          ? isRecord(value)
          : isSavedState(value) && String(value.puzzleId) === id;
        if (!valid || !isObject(value) || value.hash !== hashes.get(id)) delete values[id];
      }
      const cleaned = JSON.stringify(values);
      const raw = localStorage.getItem(key);
      if (raw !== null && raw !== cleaned) localStorage.setItem(key, cleaned);
    } catch (err) {
      console.error('Failed to clean puzzle storage:', err);
    }
  }
}

export function loadAllRecords(puzzles: readonly PuzzleIdentity[]): Record<number, PuzzleRecord> {
  const values = readStorage(RECORDS_KEY);
  const records: Record<number, PuzzleRecord> = {};
  for (const puzzle of puzzles) {
    const value = values[puzzle.id];
    if (isRecord(value) && value.hash === puzzle.hash) records[puzzle.id] = value;
  }
  return records;
}

export function savePuzzleRecord(puzzle: PuzzleIdentity, moves: number, timeSeconds: number): void {
  try {
    const record = { hash: puzzle.hash, moves, timeSeconds };
    if (!isRecord(record)) return;
    const records = readStorage(RECORDS_KEY);
    const existing = records[puzzle.id];

    // Only compare scores from the same board version; equal moves keep the old time.
    if (!isRecord(existing) || existing.hash !== puzzle.hash || moves < existing.moves) {
      records[puzzle.id] = record;
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }
  } catch (err) {
    console.error('Failed to save puzzle record:', err);
  }
}

export function loadSavedGameState(puzzle: PuzzleIdentity, model: BoardModel): SavedGameState | null {
  const value = readStorage(IN_PROGRESS_KEY)[puzzle.id];
  if (value === undefined) return null;
  if (isSavedState(value) && value.puzzleId === puzzle.id && value.hash === puzzle.hash) {
    try {
      const state = BigInt(value.stateHex);
      const history = value.historyHex.map(hex => BigInt(hex));
      const validBoardState = (candidate: bigint) =>
        candidate <= model.fullLitMask && (candidate & model.initialState) === model.initialState &&
        inspectBoard(model, candidate).valid;
      if (validBoardState(state) && history.every(validBoardState) &&
          (history.length ? history[0] === model.initialState : state === model.initialState)) {
        return value;
      }
    } catch {
      // Invalid bitmasks must reset the entire game, not just its visible board.
    }
  }
  removeSavedState(puzzle.id);
  return null;
}

export function saveGameState(state: SavedGameState): void {
  try {
    if (!isSavedState(state)) return;
    const states = readStorage(IN_PROGRESS_KEY);
    states[state.puzzleId] = state;
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(states));
  } catch (err) {
    console.error('Failed to save game state:', err);
  }
}

export function clearSavedGameState(puzzle: PuzzleIdentity): void {
  const value = readStorage(IN_PROGRESS_KEY)[puzzle.id];
  // An older open page must not clear progress saved for a newer board version.
  if (isObject(value) && value.hash === puzzle.hash) removeSavedState(puzzle.id);
}
