import { inspectBoard, transitionLight } from './core';
import type { BoardInspection, BoardModel, PuzzleDefinition } from './types';

/** Rating version is independent of the expensive exact-solution cache. */
export const ANALYSIS_VERSION = 3;
const PROBE_LIMIT = 4000;

export type DifficultyMetrics = {
  optimalMoves: number;
  minExtinguishesAtOptimal: number;
  /** Median unique explored states / (optimal moves + 1), across eight tie orders. */
  discoveryEffort: number;
  /** Steps in the representative optimal path that lose visible progress. */
  regressions: number;
  /** Longest interval needed to exceed an earlier progress peak on that path. */
  planningDepth: number;
  probeSolved: number;
  probeStates: number[];
  /** Final lamp assignments inferred by target/coverage constraint propagation. */
  inferredCells: number;
};

function bitCount(mask: bigint): number {
  let count = 0;
  while (mask !== 0n) {
    mask &= mask - 1n;
    count++;
  }
  return count;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Infer final lamps only: a forbidden final lamp can still be a legal relay. */
function inferFinalLamps(model: BoardModel): Map<number, boolean> {
  const assignments = new Map<number, boolean>([[model.seedIndex, true]]);
  const constraints: { cells: number[]; target: number; exact: boolean }[] =
    model.walls.flatMap((wall, wallIndex) => wall.value === '#' ? [] : [{
      cells: model.rays.flatMap((ray, cell) => ray.hits.includes(wallIndex) ? [cell] : []),
      target: Number(wall.value), exact: true,
    }]);
  for (let cell = 0; cell < model.cells.length; cell++) {
    const bit = 1n << BigInt(cell);
    constraints.push({ cells: model.rays.flatMap((ray, index) =>
      (ray.litMask & bit) !== 0n ? [index] : []), target: 1, exact: false });
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const constraint of constraints) {
      const on = constraint.cells.filter(cell => assignments.get(cell) === true).length;
      const unknown = constraint.cells.filter(cell => !assignments.has(cell));
      const remaining = constraint.target - on;
      const forced = constraint.exact && remaining === 0 ? false :
        remaining > 0 && remaining === unknown.length ? true : undefined;
      if (forced === undefined) continue;
      for (const cell of unknown) {
        assignments.set(cell, forced);
        changed = true;
      }
    }
  }
  return assignments;
}

/**
 * A bounded local-progress model, not the exact solver's BFS/IDA* work count.
 * It prefers illuminating new cells and satisfying targets, but can backtrack.
 * Eight geometric tie orders reduce dependence on the board's orientation.
 * This approximates discovery difficulty; it is not calibrated player data.
 */
export function analyzeDifficulty(
  model: BoardModel,
  solution: { path: number[]; optimalMoves: number; minExtinguishesAtOptimal: number },
): DifficultyMetrics {
  const targets = model.walls.map(wall => wall.value === '#' ? 0 : Number(wall.value));
  const numberedWalls = Math.max(1, targets.filter(target => target > 0).length);
  const progress = (inspection: BoardInspection): number =>
    bitCount(inspection.litMask) / model.cells.length +
    targets.reduce((sum, target, wall) => sum +
      (target > 0 ? inspection.counts[wall] / target : 0), 0) / numberedWalls;
  const initialProgress = progress(inspectBoard(model, model.initialState));
  let state = model.initialState;
  let previous = initialProgress;
  let peak = initialProgress;
  let peakStep = 0;
  let regressions = 0;
  let planningDepth = 0;
  for (const [step, cell] of solution.path.entries()) {
    const move = transitionLight(model, state, cell);
    if (!move.ok) throw new Error('Difficulty analysis received an illegal solution path');
    state = move.state;
    const value = progress(inspectBoard(model, state));
    if (value < previous - 1e-9) regressions++;
    const exceedsPeak = value > peak + 1e-9;
    planningDepth = Math.max(planningDepth, step + 1 - peakStep - (exceedsPeak ? 1 : 0));
    if (exceedsPeak) {
      peak = value;
      peakStep = step + 1;
    }
    previous = value;
  }
  if (solution.path.length !== solution.optimalMoves || !inspectBoard(model, state).won) {
    throw new Error('Difficulty analysis requires a complete optimal solution path');
  }
  const inferred = inferFinalLamps(model);
  const finalAlignment = (state: bigint): number => {
    let correct = 0;
    for (const [cell, on] of inferred) {
      if (((state & (1n << BigInt(cell))) !== 0n) === on) correct++;
    }
    return correct / inferred.size;
  };
  const maxDepth = solution.optimalMoves + Math.max(6, Math.ceil(solution.optimalMoves / 2));
  type Candidate = { state: bigint; progress: number; cell: number };
  type Frame = { state: bigint; candidates?: Candidate[]; next: number };
  const probes = Array.from({ length: 8 }, (_, order) => {
    const ranks = model.cells.map((cell, index) => {
      const r = order & 1 ? model.h - 1 - cell.r : cell.r;
      const c = order & 2 ? model.w - 1 - cell.c : cell.c;
      return { index, rank: order & 4 ? c * model.h + r : r * model.w + c };
    }).sort((a, b) => a.rank - b.rank);
    const rank = new Map(ranks.map((cell, index) => [cell.index, index]));
    const stack: Frame[] = [{ state: model.initialState, next: 0 }];
    const depths = new Map<bigint, number>();
    let visits = 0;
    // Separate visit and unique-state limits prevent excessive shallower revisits.
    while (stack.length && depths.size < PROBE_LIMIT && visits < 4 * PROBE_LIMIT) {
      const frame = stack[stack.length - 1];
      const depth = stack.length - 1;
      if (!frame.candidates) {
        const seenDepth = depths.get(frame.state);
        if (seenDepth !== undefined && seenDepth <= depth) {
          stack.pop();
          continue;
        }
        depths.set(frame.state, depth);
        visits++;
        const inspection = inspectBoard(model, frame.state);
        if (inspection.won) return { solved: true, states: depths.size };
        if (depth >= maxDepth) {
          stack.pop();
          continue;
        }
        frame.candidates = [];
        for (let cell = 0; cell < model.cells.length; cell++) {
          const move = transitionLight(model, frame.state, cell, inspection);
          if (!move.ok) continue;
          const seen = depths.get(move.state);
          if (seen !== undefined && seen <= depth + 1) continue;
          // Quantize tiny floating-point differences so rotated sums tie equally.
          const preference = progress(inspectBoard(model, move.state)) + finalAlignment(move.state);
          frame.candidates.push({ state: move.state, cell,
            progress: Math.round(preference * 1e9) / 1e9 });
        }
        frame.candidates.sort((a, b) => b.progress - a.progress || rank.get(a.cell)! - rank.get(b.cell)!);
      }
      const candidate = frame.candidates[frame.next++];
      if (!candidate) {
        stack.pop();
        continue;
      }
      stack.push({ state: candidate.state, next: 0 });
    }
    // Unfinished probes are censored observations, never proofs of unsolvability.
    return { solved: false, states: depths.size };
  });
  return {
    optimalMoves: solution.optimalMoves,
    minExtinguishesAtOptimal: solution.minExtinguishesAtOptimal,
    discoveryEffort: Math.max(1, median(probes.map(probe => probe.states)) / (solution.optimalMoves + 1)),
    regressions, planningDepth,
    probeSolved: probes.filter(probe => probe.solved).length,
    probeStates: probes.map(probe => probe.states),
    inferredCells: inferred.size,
  };
}

/** Fixed thresholds: adding puzzles does not change existing ratings. */
export function rateDifficulty(metrics: DifficultyMetrics): { score: number; difficulty: PuzzleDefinition['difficulty'] } {
  const score = Math.round((
    2 * Math.log2(metrics.discoveryEffort)
    + 0.15 * metrics.optimalMoves
    + 0.6 * metrics.minExtinguishesAtOptimal
    + 0.5 * metrics.regressions
    + 0.5 * metrics.planningDepth
  ) * 10) / 10;
  return { score, difficulty: score < 8 ? 'easy' : score < 17 ? 'medium' : 'hard' };
}
