export interface PuzzleRecord {
  moves: number;
  timeSeconds: number;
}

export interface SavedGameState {
  puzzleId: number;
  stateHex: string;
  moves: number;
  startTime: number | null;
  historyHex: string[];
}

const RECORDS_KEY = 'nighty_akari_records';
const IN_PROGRESS_KEY = 'nighty_akari_in_progress';

export function loadAllRecords(): Record<number, PuzzleRecord> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePuzzleRecord(puzzleId: number, moves: number, timeSeconds: number): void {
  try {
    const records = loadAllRecords();
    const existing = records[puzzleId];

    // Only update if no record yet, or if new moves are strictly less
    // If moves are not fewer, do not update time or moves
    if (!existing || moves < existing.moves) {
      records[puzzleId] = { moves, timeSeconds };
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }
  } catch (err) {
    console.error('Failed to save puzzle record:', err);
  }
}

export function loadSavedGameState(puzzleId: number): SavedGameState | null {
  try {
    const raw = localStorage.getItem(IN_PROGRESS_KEY);
    if (!raw) return null;
    const states = JSON.parse(raw);
    return states[puzzleId] || null;
  } catch {
    return null;
  }
}

export function saveGameState(state: SavedGameState): void {
  try {
    const raw = localStorage.getItem(IN_PROGRESS_KEY);
    const states = raw ? JSON.parse(raw) : {};
    states[state.puzzleId] = state;
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(states));
  } catch (err) {
    console.error('Failed to save game state:', err);
  }
}

export function clearSavedGameState(puzzleId: number): void {
  try {
    const raw = localStorage.getItem(IN_PROGRESS_KEY);
    if (!raw) return;
    const states = JSON.parse(raw);
    if (states[puzzleId]) {
      delete states[puzzleId];
      localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(states));
    }
  } catch (err) {
    console.error('Failed to clear game state:', err);
  }
}
