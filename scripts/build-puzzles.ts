import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildBoard } from '../src/engine/core';
import { solvePuzzle, SOLVER_VERSION } from '../src/engine/solver';
import { analyzeDifficulty, rateDifficulty, ANALYSIS_VERSION } from '../src/engine/difficulty';
import type { PuzzleDefinition, PuzzleIndexEntry, PuzzleInput } from '../src/engine/types';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const GENERATED = resolve(ROOT, 'puzzles/generated');
const SOURCE = resolve(ROOT, 'puzzles/source');
const CACHE = resolve(ROOT, '.puzzle-cache');
const START_DATE = '2026-10-01';

type Solved = Extract<ReturnType<typeof solvePuzzle>, { status: 'solved' }>;
type BuildOptions = {
  algorithm?: 'bfs' | 'ida';
  maxStates?: number;
  timeoutMs?: number;
};

export function parseBuildOptions(args: string[]): BuildOptions {
  const { values } = parseArgs({
    args,
    options: {
      algorithm: { type: 'string' },
      'max-states': { type: 'string' },
      'timeout-seconds': { type: 'string' },
    },
  });
  const algorithm = values.algorithm;
  if (algorithm !== undefined && algorithm !== 'bfs' && algorithm !== 'ida') {
    throw new Error('--algorithm must be bfs or ida');
  }
  function budget(name: 'max-states' | 'timeout-seconds'): number | undefined {
    const raw = values[name];
    if (raw === undefined) return undefined;
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`--${name} must be a non-negative integer (0 means unlimited)`);
    }
    return value;
  }
  const seconds = budget('timeout-seconds');
  return { algorithm, maxStates: budget('max-states'), timeoutMs: seconds === undefined ? undefined : seconds * 1000 };
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, path);
}

async function readCached(path: string): Promise<Solved | undefined> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as Solved;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

export async function buildPuzzles(options: BuildOptions = {}): Promise<PuzzleIndexEntry[]> {
  const files = (await readdir(SOURCE)).filter(file => file.endsWith('.json')).sort();
  if (!files.length) throw new Error('No puzzle JSON files in puzzles/source');
  const puzzles: PuzzleDefinition[] = [];
  const report = [];

  for (const [index, file] of files.entries()) {
    const id = index + 1;
    const input: PuzzleInput = JSON.parse(await readFile(resolve(SOURCE, file), 'utf8'));
    const board = buildBoard({ ...input, id });
    const hash = createHash('sha256').update(JSON.stringify({
      version: SOLVER_VERSION, rows: input.rows, seed: input.seed,
    })).digest('hex');
    const cachePath = resolve(CACHE, `${hash}.json`);
    const started = performance.now();
    const cached = await readCached(cachePath);
    console.log(`[${id}/${files.length}] ${file}: ${cached ? 'cached' : 'solving'}`);
    const result = cached ?? solvePuzzle(board, options);
    if (result.status !== 'solved') {
      throw new Error(`${file}: ${result.status} after ${result.visitedStates} states; nothing published`);
    }
    if (!cached) await writeJson(cachePath, result);
    const metrics = analyzeDifficulty(board, result);
    const rating = rateDifficulty(metrics);
    const date = new Date(`${START_DATE}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    puzzles.push({
      id, date: date.toISOString().slice(0, 10), rows: input.rows, seed: input.seed,
      optimalMoves: result.optimalMoves, difficulty: rating.difficulty,
    });
    report.push({
      file, id, score: rating.score, difficulty: rating.difficulty, ...result, ...metrics,
      whiteCells: board.cells.length, elapsedMs: Math.round(performance.now() - started), cached: Boolean(cached),
    });
    console.log(`  ${result.optimalMoves} moves, ${result.minExtinguishesAtOptimal} extinguishes, score ${rating.score}: ${rating.difficulty}`);
    console.log(`  discovery ${metrics.discoveryEffort.toFixed(1)}x, planning ${metrics.planningDepth}, probes ${metrics.probeSolved}/8 solved`);
  }

  // Replace local output only after every source puzzle is fully analyzed.
  await rm(GENERATED, { recursive: true, force: true });
  const index: PuzzleIndexEntry[] = [];
  for (const { rows, seed, ...metadata } of puzzles) {
    const file = `boards/${metadata.id}.json`;
    await writeJson(resolve(GENERATED, file), { rows, seed });
    index.push({ ...metadata, file });
  }
  await writeJson(resolve(GENERATED, 'analysis.json'), { version: ANALYSIS_VERSION, puzzles: report });
  await writeJson(resolve(GENERATED, 'index.json'), index);
  console.log(`Generated index.json and ${index.length} boards in puzzles/generated`);
  return index;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPuzzles(parseBuildOptions(process.argv.slice(2))).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
