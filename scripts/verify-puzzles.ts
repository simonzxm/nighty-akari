import { buildBoard } from '../src/engine/core.ts';
import { solvePuzzle } from '../src/engine/solver.ts';
import { PuzzleDefinition } from '../src/engine/types.ts';

const candidatePuzzles: PuzzleDefinition[] = [
  {
    id: 'p-001',
    number: 1,
    name: { en: 'Borrow Light', zh: '借光' },
    subtitle: { en: 'First steps in the dark', zh: '初试光线' },
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
  },
  {
    id: 'p-004',
    number: 4,
    name: { en: 'Corner Stone', zh: '转角' },
    subtitle: { en: 'Careful routing', zh: '直角交汇' },
    date: '2026-10-04',
    rows: [
      "..1..",
      ".#...0",
      "1...1.",
      ".2..#.",
      "....1.",
      "0..1.."
    ],
    seed: [1, 1],
    optimalMoves: 6,
    difficulty: 'medium'
  },
  {
    id: 'p-005',
    number: 5,
    name: { en: 'Crossroads', zh: '十字星' },
    subtitle: { en: 'Symmetric constraints', zh: '交错的射线' },
    date: '2026-10-05',
    rows: [
      ".....",
      ".2.1.",
      "..#..",
      ".1.2.",
      "....."
    ],
    seed: [3, 3],
    optimalMoves: 6,
    difficulty: 'easy'
  },
  {
    id: 'p-006',
    number: 6,
    name: { en: 'Constellation', zh: '星群' },
    subtitle: { en: 'Chain reaction', zh: '连锁点亮' },
    date: '2026-10-06',
    rows: [
      ".1..0.",
      "....2.",
      "0.1...",
      "...2.1",
      ".1....",
      ".0..1."
    ],
    seed: [2, 2],
    optimalMoves: 8,
    difficulty: 'hard'
  },
  {
    id: 'p-007',
    number: 7,
    name: { en: 'Lantern Walk', zh: '提灯夜行' },
    subtitle: { en: 'End of week challenge', zh: '周末特别挑战' },
    date: '2026-10-07',
    rows: [
      "1....0",
      "..2...",
      "....1.",
      ".1....",
      "...2..",
      "0....1"
    ],
    seed: [1, 2],
    optimalMoves: 8,
    difficulty: 'hard'
  }
];

for (const p of candidatePuzzles) {
  try {
    const board = buildBoard(p);
    const start = performance.now();
    const sol = solvePuzzle(board);
    const elapsed = (performance.now() - start).toFixed(1);
    if (sol) {
      console.log(`Puzzle ${p.number} (${p.name.en}): Solved in ${elapsed}ms, Optimal: ${sol.optimalMoves} moves (Expected: ${p.optimalMoves}), Visited states: ${sol.visitedStates}`);
      p.optimalMoves = sol.optimalMoves;
    } else {
      console.error(`Puzzle ${p.number} (${p.name.en}): UNSOLVABLE!`);
    }
  } catch (err) {
    console.error(`Puzzle ${p.number} error:`, err);
  }
}
