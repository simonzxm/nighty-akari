export interface PuzzleRecord {
  puzzleId: string;
  puzzleNumber: number;
  completed: boolean;
  moves: number;
  timeSeconds: number;
  completedAt: string;
}

export interface SavedGameState {
  puzzleId: string;
  stateHex: string; // BigInt serialized as hex
  moves: number;
  startTime: number | null;
  historyHex: string[]; // for undo
}

const RECORDS_KEY = 'nighty_akari_records_v1';
const CURRENT_GAME_KEY = 'nighty_akari_current_game_v1';

export function loadAllRecords(): Record<string, PuzzleRecord> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function savePuzzleRecord(record: PuzzleRecord): void {
  try {
    const records = loadAllRecords();
    records[record.puzzleId] = record;
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save puzzle record:', err);
  }
}

export function loadSavedGameState(puzzleId: string): SavedGameState | null {
  try {
    const raw = localStorage.getItem(CURRENT_GAME_KEY);
    if (!raw) return null;
    const data: SavedGameState = JSON.parse(raw);
    if (data.puzzleId !== puzzleId) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveGameState(state: SavedGameState): void {
  try {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save game state:', err);
  }
}

export function clearSavedGameState(puzzleId: string): void {
  try {
    const current = loadSavedGameState(puzzleId);
    if (current) {
      localStorage.removeItem(CURRENT_GAME_KEY);
    }
  } catch (err) {
    console.error('Failed to clear game state:', err);
  }
}
