import {
  ActionResult,
  BoardInspection,
  BoardModel,
  CellCoord,
  PuzzleDefinition,
  RayData,
  WallData,
} from './types';

/**
 * Builds the board model from a puzzle definition.
 */
export function buildBoard(puzzle: PuzzleDefinition): BoardModel {
  const rows = puzzle.rows;
  const h = rows.length;
  const w = rows[0].length;
  const cells: CellCoord[] = [];
  const walls: WallData[] = [];

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const char = rows[r][c];
      if (char === '.') {
        cells.push({ r, c });
      } else {
        walls.push({
          r,
          c,
          value: char as WallData['value'],
        });
      }
    }
  }

  const ix = new Map<string, number>();
  cells.forEach((p, i) => ix.set(`${p.r},${p.c}`, i));

  const wi = new Map<string, number>();
  walls.forEach((p, i) => wi.set(`${p.r},${p.c}`, i));

  const rays: RayData[] = cells.map((p, i) => {
    let litMask = 1n << BigInt(i);
    const hits: number[] = [];

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const;

    for (const [dr, dc] of dirs) {
      let r = p.r + dr;
      let c = p.c + dc;
      while (r >= 0 && r < h && c >= 0 && c < w) {
        const key = `${r},${c}`;
        if (wi.has(key)) {
          hits.push(wi.get(key)!);
          break; // wall blocks ray
        }
        litMask |= 1n << BigInt(ix.get(key)!);
        r += dr;
        c += dc;
      }
    }
    return { litMask, hits };
  });

  const seedIndex = ix.get(`${puzzle.seed[0] - 1},${puzzle.seed[1] - 1}`);
  if (seedIndex === undefined) {
    throw new Error(`Seed coordinate [${puzzle.seed.join(',')}] is not a valid white cell`);
  }

  const initialState = 1n << BigInt(seedIndex);
  const fullLitMask = (1n << BigInt(cells.length)) - 1n;

  return {
    id: puzzle.id,
    rows,
    h,
    w,
    cells,
    walls,
    ix,
    wi,
    rays,
    seedIndex,
    initialState,
    fullLitMask,
  };
}

/**
 * Calculates current illumination mask and wall hit counts for a given bulb state.
 */
export function inspectBoard(m: BoardModel, state: bigint): BoardInspection {
  let litMask = 0n;
  const counts = new Array(m.walls.length).fill(0);

  for (let i = 0; i < m.cells.length; i++) {
    if ((state & (1n << BigInt(i))) !== 0n) {
      litMask |= m.rays[i].litMask;
      for (const wIdx of m.rays[i].hits) {
        counts[wIdx]++;
      }
    }
  }

  const overloadedWalls: number[] = [];
  let valid = true;
  let allTargetsMet = true;

  for (let j = 0; j < m.walls.length; j++) {
    const wall = m.walls[j];
    if (wall.value !== '#') {
      const target = Number(wall.value);
      if (counts[j] > target) {
        valid = false;
        overloadedWalls.push(j);
      }
      if (counts[j] !== target) {
        allTargetsMet = false;
      }
    }
  }

  const won = valid && allTargetsMet && litMask === m.fullLitMask;

  return {
    litMask,
    counts,
    valid,
    won,
    overloadedWalls,
  };
}

/**
 * Attempts to place or extinguish a light at cell index `i`.
 */
export function tryToggleLight(m: BoardModel, state: bigint, i: number): ActionResult {
  if (i < 0 || i >= m.cells.length) {
    return { ok: false, reasonKey: 'out_of_bounds' };
  }

  // Seed light is permanent
  if (i === m.seedIndex) {
    return { ok: false, reasonKey: 'seed_permanent' };
  }

  const bit = 1n << BigInt(i);
  const isCurrentlyOn = (state & bit) !== 0n;
  const currentInspection = inspectBoard(m, state);

  // If placing: cell must be currently illuminated
  if (!isCurrentlyOn && (currentInspection.litMask & bit) === 0n) {
    return { ok: false, reasonKey: 'not_illuminated' };
  }

  const nextState = state ^ bit;
  const nextInspection = inspectBoard(m, nextState);

  // If placing: must not exceed any wall capacity
  if (!nextInspection.valid) {
    const firstBadWall = nextInspection.overloadedWalls[0];
    return {
      ok: false,
      reasonKey: 'wall_limit_exceeded',
      wallIndex: firstBadWall,
    };
  }

  return {
    ok: true,
    state: nextState,
    inspection: nextInspection,
    toggledCell: i,
    actionType: isCurrentlyOn ? 'extinguish' : 'place',
  };
}
