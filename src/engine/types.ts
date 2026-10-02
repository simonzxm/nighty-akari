export type CellCoord = {
  r: number;
  c: number;
};

export type WallData = {
  r: number;
  c: number;
  value: '#' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
};

export type RayData = {
  /** Bitmask of white cells illuminated by a light placed at this cell (including itself) */
  litMask: bigint;
  /** Wall indices hit by the 4 rays of this cell */
  hits: number[];
};

export type PuzzleInput = {
  rows: string[];
  seed: [number, number]; // [row, col], 1-indexed
};

export type PuzzleDefinition = PuzzleInput & {
  id: number;
  date: string; // YYYY-MM-DD
  optimalMoves: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type BoardModel = {
  id: number;
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

export type LightTransitionResult =
  | {
      ok: true;
      state: bigint;
      toggledCell: number;
      actionType: 'place' | 'extinguish';
    }
  | {
      ok: false;
      reasonKey: 'out_of_bounds' | 'seed_permanent' | 'not_illuminated' | 'wall_limit_exceeded';
      wallIndex?: number;
    };

export type ActionResult =
  | (Extract<LightTransitionResult, { ok: true }> & { inspection: BoardInspection })
  | Extract<LightTransitionResult, { ok: false }>;
