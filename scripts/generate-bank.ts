import * as fs from 'fs';
import * as path from 'path';
import { buildBoard, inspectBoard } from '../src/engine/core.ts';
import { solvePuzzle } from '../src/engine/solver.ts';
import { PuzzleDefinition } from '../src/engine/types.ts';

function generateCandidate(h: number, w: number, wallProb: number = 0.25): { rows: string[]; seed: [number, number] } | null {
  const grid: string[][] = Array.from({ length: h }, () => Array(w).fill('.'));
  
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (Math.random() < wallProb) {
        grid[r][c] = '#';
      }
    }
  }

  const whiteCells: [number, number][] = [];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (grid[r][c] === '.') whiteCells.push([r, c]);
    }
  }

  if (whiteCells.length < h * w * 0.6) return null;

  const seed = whiteCells[Math.floor(Math.random() * whiteCells.length)];

  const dummyPuzzle: PuzzleDefinition = {
    id: 'test',
    number: 0,
    name: { en: 'test', zh: 'test' },
    date: '2026-10-01',
    rows: grid.map(r => r.join('')),
    seed: [seed[0] + 1, seed[1] + 1],
    optimalMoves: 0,
    difficulty: 'easy'
  };

  const model = buildBoard(dummyPuzzle);

  const queue: bigint[] = [model.initialState];
  const visited = new Set<bigint>([model.initialState]);
  let foundState: bigint | null = null;

  let steps = 0;
  while (queue.length > 0 && steps < 1200) {
    steps++;
    const idx = Math.floor(Math.random() * queue.length);
    const cur = queue.splice(idx, 1)[0];
    const curInspect = inspectBoard(model, cur);

    if (curInspect.litMask === model.fullLitMask) {
      foundState = cur;
      break;
    }

    for (let i = 0; i < model.cells.length; i++) {
      if (i === model.seedIndex) continue;
      const bit = 1n << BigInt(i);
      const isOn = (cur & bit) !== 0n;
      if (!isOn && (curInspect.litMask & bit) === 0n) continue;

      const next = cur ^ bit;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  if (!foundState) return null;

  const finalInspect = inspectBoard(model, foundState);

  for (let j = 0; j < model.walls.length; j++) {
    const wall = model.walls[j];
    const count = finalInspect.counts[j];
    if (Math.random() < 0.8) {
      grid[wall.r][wall.c] = String(count);
    } else {
      grid[wall.r][wall.c] = '#';
    }
  }

  return {
    rows: grid.map(r => r.join('')),
    seed: [seed[0] + 1, seed[1] + 1]
  };
}

console.log('Generating verified puzzles...');
const validList: PuzzleDefinition[] = [
  {
    id: 'p-001',
    number: 1,
    name: { en: 'Borrow Light', zh: '借光' },
    subtitle: { en: 'Lighting the corners', zh: '借光启程' },
    date: '2026-10-01',
    rows: [
      "...10",
      "#1.0#",
      "....1",
      "...21",
      "3...."
    ],
    seed: [4, 1],
    optimalMoves: 7,
    difficulty: 'easy'
  },
  {
    id: 'p-002',
    number: 2,
    name: { en: 'The Bridge', zh: '过桥' },
    subtitle: { en: 'Temporary scaffolds', zh: '搭建临时通道' },
    date: '2026-10-02',
    rows: [
      "...#1",
      "3....",
      "....2",
      ".0#..",
      "#01.."
    ],
    seed: [3, 1],
    optimalMoves: 9,
    difficulty: 'medium'
  },
  {
    id: 'p-003',
    number: 3,
    name: { en: 'Relay', zh: '交接' },
    subtitle: { en: 'Release wall limits', zh: '释放黑块容量' },
    date: '2026-10-03',
    rows: [
      "0##..",
      "10#.1",
      ".3..2",
      "..#..",
      "2...2"
    ],
    seed: [3, 3],
    optimalMoves: 11,
    difficulty: 'hard'
  }
];

const titles = [
  { en: 'Detour', zh: '绕行', subEn: 'Curve around obstacles', subZh: '避开正面阻截' },
  { en: 'Flicker', zh: '微光', subEn: 'A faint gleam', subZh: '黑暗中的光点' },
  { en: 'Crossroads', zh: '十字路', subEn: 'Perpendicular beams', subZh: '纵横交错' },
  { en: 'Scaffolding', zh: '脚手架', subEn: 'Build and dismantle', subZh: '建起再拆除' },
  { en: 'Night Corridor', zh: '夜廊', subEn: 'A winding path', subZh: '幽长回廊' },
  { en: 'Beacon', zh: '灯塔', subEn: 'Guide the ship home', subZh: '指引归航' },
  { en: 'Prism', zh: '棱镜', subEn: 'Splitting directions', subZh: '折射与汇聚' },
  { en: 'Sanctuary', zh: '庇护所', subEn: 'Safe illumination', subZh: '安稳的明亮' },
  { en: 'Starlight', zh: '星辉', subEn: 'Distant beacons', subZh: '遥遥相望' },
  { en: 'Nightfall', zh: '暮色', subEn: 'Before complete darkness', subZh: '夜幕降临前' },
  { en: 'Aurora', zh: '极光', subEn: 'Curtain of light', subZh: '天际微澜' },
  { en: 'Lantern Walk', zh: '提灯', subEn: 'Patience in the dark', subZh: '步履不停' },
  { en: 'Labyrinth', zh: '迷宫', subEn: 'Every step counts', subZh: '分毫不差' },
  { en: 'Dawn', zh: '破晓', subEn: 'Breaking the shadows', subZh: '破晓之光' },
];

let attempts = 0;
while (validList.length < 16 && attempts < 3000) {
  attempts++;
  const cand = generateCandidate(5, 5, 0.22);
  if (!cand) continue;

  const num = validList.length + 1;
  const title = titles[num - 4] || { en: `Path ${num}`, zh: `旅程 ${num}`, subEn: 'Night journey', subZh: '夜行' };

  const dayStr = String(num).padStart(2, '0');
  const puzzle: PuzzleDefinition = {
    id: `p-${String(num).padStart(3, '0')}`,
    number: num,
    name: { en: title.en, zh: title.zh },
    subtitle: { en: title.subEn, zh: title.subZh },
    date: `2026-10-${dayStr}`,
    rows: cand.rows,
    seed: cand.seed,
    optimalMoves: 99,
    difficulty: 'medium'
  };

  try {
    const board = buildBoard(puzzle);
    const sol = solvePuzzle(board);
    if (sol && sol.optimalMoves >= 5 && sol.optimalMoves <= 14) {
      puzzle.optimalMoves = sol.optimalMoves;
      puzzle.difficulty = sol.optimalMoves <= 6 ? 'easy' : sol.optimalMoves <= 9 ? 'medium' : 'hard';
      validList.push(puzzle);
      console.log(`Found valid puzzle No.${num} (${puzzle.name.en}): optimal = ${sol.optimalMoves} moves`);
    }
  } catch {}
}

const outDir = path.resolve('src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const fileContent = `// Automatically verified and generated daily puzzle bank
import { PuzzleDefinition } from '../engine/types';

export const DAILY_PUZZLES: PuzzleDefinition[] = ${JSON.stringify(validList, null, 2)};
`;

fs.writeFileSync(path.join(outDir, 'puzzles.ts'), fileContent, 'utf-8');
console.log(`Successfully generated and wrote ${validList.length} verified puzzles to src/data/puzzles.ts!`);
