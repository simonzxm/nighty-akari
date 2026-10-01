export type CellCoord = {
  r: number;
  c: number;
};

export type WallData = {
  r: number;
  c: number;
  value: '#' | '0' | '1' | '2' | '3' | '4';
};

export type RayData = {
  /** Bitmask of white cells illuminated by a light placed at this cell (including itself) */
  litMask: bigint;
  /** Wall indices hit by the 4 rays of this cell */
  hits: number[];
};

export type PuzzleDefinition = {
  id: string;
  name: {
    en: string;
    zh: string;
  };
  subtitle?: {
    en: string;
    zh: string;
  };
  date: string; // YYYY-MM-DD
  number: number;
  rows: string[];
  seed: [number, number]; // [row, col], 1-indexed for easy reading in JSON
  optimalMoves: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type BoardModel = {
  id: string;
  rows: string[];
  h: number;
  w: number;
  cells: CellCoord[];
  walls: WallData[];
  ix: Map<string, number>; // "r,c" -> cell index
  wi: Map<string, number>; // "r,c" -> wall index
  rays: RayData[];
  seedIndex: number;
  initialState: bigint;
  fullLitMask: bigint;
};

export type BoardInspection = {
  litMask: bigint;
  counts: number[];
  valid: boolean;
  won: boolean;
  overloadedWalls: number[]; // indices of walls that exceed target
};

export type ActionResult =
  | {
      ok: true;
      state: bigint;
      inspection: BoardInspection;
      toggledCell: number;
      actionType: 'place' | 'extinguish';
    }
  | {
      ok: false;
      reasonKey: 'out_of_bounds' | 'seed_permanent' | 'not_illuminated' | 'wall_limit_exceeded';
      wallIndex?: number;
    };
