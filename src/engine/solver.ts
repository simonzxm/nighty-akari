import type { BoardInspection, BoardModel } from './types';
import { inspectBoard, transitionLight } from './core';

/** Bump when exact solver results or their metrics change. */
export const SOLVER_VERSION = 2;

export type SolveOptions = {
  algorithm?: 'bfs' | 'ida';
  /** BFS: unique discovered states. IDA*: cumulative state visits across iterations. */
  maxStates?: number;
  /** Zero or omitted means no time limit. */
  timeoutMs?: number;
};

export type SolutionResult =
  | {
      status: 'solved';
      path: number[];
      optimalMoves: number;
      minExtinguishesAtOptimal: number;
      visitedStates: number;
    }
  | { status: 'unsolvable' | 'incomplete'; visitedStates: number };

type SearchNode = {
  depth: number;
  extinguishes: number;
  parent: bigint | null;
  cell: number;
};

/**
 * Finds the shortest legal solution, then minimizes extinguishes at that depth.
 * Defaults to BFS at <=20 white cells, otherwise low-memory IDA*.
 * Budgets are unlimited when omitted or zero; a partial optimum is never returned.
 */
export function solvePuzzle(model: BoardModel, options: SolveOptions = {}): SolutionResult {
  const algorithm = options.algorithm ?? (model.cells.length <= 20 ? 'bfs' : 'ida');
  if (algorithm !== 'bfs' && algorithm !== 'ida') {
    throw new TypeError('Unknown solver algorithm');
  }
  for (const [name, value] of Object.entries({ maxStates: options.maxStates, timeoutMs: options.timeoutMs })) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0 ||
        (name === 'maxStates' && !Number.isInteger(value)))) {
      throw new RangeError(`${name} must be a nonnegative ${name === 'maxStates' ? 'integer' : 'number'}`);
    }
  }
  const maxStates = options.maxStates || Infinity;
  const deadline = options.timeoutMs ? performance.now() + options.timeoutMs : Infinity;
  const expired = () => performance.now() >= deadline;
  const initialInspection = inspectBoard(model, model.initialState);
  if (!initialInspection.valid) {
    throw new Error('Cannot solve a board with an invalid initial state');
  }

  if (algorithm === 'bfs') {
    return solveBfs(model, maxStates, expired);
  }
  return solveIda(model, maxStates, expired);
}

function solveBfs(model: BoardModel, maxStates: number, expired: () => boolean): SolutionResult {
  const nodes = new Map<bigint, SearchNode>([
    [model.initialState, { depth: 0, extinguishes: 0, parent: null, cell: -1 }],
  ]);
  let layer = [model.initialState];
  let depth = 0;
  const incomplete = (): SolutionResult => ({ status: 'incomplete', visitedStates: nodes.size });

  // Collection capacity failures are incomplete searches, never proofs of no solution.
  try {
    while (layer.length > 0) {
      let winner: bigint | undefined;
      let winnerExtinguishes = Infinity;
      // Every parent in the preceding layer has finished updating this layer.
      for (const state of layer) {
        if (expired()) return incomplete();
        const node = nodes.get(state)!;
        if (node.extinguishes < winnerExtinguishes && inspectBoard(model, state).won) {
          winner = state;
          winnerExtinguishes = node.extinguishes;
        }
      }
      if (winner !== undefined) {
        const path: number[] = [];
        let state = winner;
        while (state !== model.initialState) {
          const node = nodes.get(state)!;
          path.push(node.cell);
          state = node.parent!;
        }
        path.reverse();
        return {
          status: 'solved', path, optimalMoves: depth,
          minExtinguishesAtOptimal: winnerExtinguishes, visitedStates: nodes.size,
        };
      }

      const nextLayer: bigint[] = [];
      for (const state of layer) {
        if (expired()) return incomplete();
        const inspection = inspectBoard(model, state);
        const node = nodes.get(state)!;
        for (let cell = 0; cell < model.cells.length; cell++) {
          const move = transitionLight(model, state, cell, inspection);
          if (!move.ok) continue;
          const extinguishes = node.extinguishes + (move.actionType === 'extinguish' ? 1 : 0);
          const existing = nodes.get(move.state);
          if (existing) {
            if (existing.depth === depth + 1 && extinguishes < existing.extinguishes) {
              existing.extinguishes = extinguishes;
              existing.parent = state;
              existing.cell = cell;
            }
            continue;
          }
          if (nodes.size >= maxStates || expired()) return incomplete();
          nodes.set(move.state, { depth: depth + 1, extinguishes, parent: state, cell });
          nextLayer.push(move.state);
        }
      }
      layer = nextLayer;
      depth++;
    }
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return incomplete();
  }
  return { status: 'unsolvable', visitedStates: nodes.size };
}

function bitCount(mask: bigint): number {
  let count = 0;
  while (mask !== 0n) {
    mask &= mask - 1n;
    count++;
  }
  return count;
}

function solveIda(model: BoardModel, maxStates: number, expired: () => boolean): SolutionResult {
  const maxCoverage = model.rays.reduce((max, ray) => Math.max(max, bitCount(ray.litMask)), 1);
  const targets = model.walls.map((wall) => wall.value === '#' ? -1 : Number(wall.value));
  // One placement illuminates <=maxCoverage cells and adds <=1 hit per wall.
  // Extinguishing cannot help either deficit: both bounds remain admissible.
  const heuristic = (inspection: BoardInspection): number => {
    let bound = Math.ceil(bitCount(model.fullLitMask & ~inspection.litMask) / maxCoverage);
    for (let wall = 0; wall < targets.length; wall++) {
      bound = Math.max(bound, targets[wall] - inspection.counts[wall]);
    }
    return bound;
  };

  // Explicit DFS frames avoid the JavaScript recursion limit on arbitrary boards.
  type Frame = {
    state: bigint;
    extinguishes: number;
    inspection?: BoardInspection;
    nextCell: number;
  };
  let visitedStates = 0;
  let threshold = heuristic(inspectBoard(model, model.initialState));

  while (true) {
    const path: number[] = [];
    const ancestors = new Set<bigint>([model.initialState]);
    const stack: Frame[] = [{ state: model.initialState, extinguishes: 0, nextCell: 0 }];
    let nextThreshold = Infinity;
    let bestPath: number[] | undefined;
    let bestExtinguishes = Infinity;
    let bestDepth = Infinity;
    const pop = () => {
      ancestors.delete(stack.pop()!.state);
      if (path.length > 0) path.pop();
    };

    while (stack.length > 0) {
      if (expired()) return { status: 'incomplete', visitedStates };
      const frame = stack[stack.length - 1];
      const depth = path.length;
      if (!frame.inspection) {
        if (visitedStates >= maxStates) return { status: 'incomplete', visitedStates };
        visitedStates++;
        frame.inspection = inspectBoard(model, frame.state);
        const estimate = depth + heuristic(frame.inspection);
        if (estimate > threshold) {
          nextThreshold = Math.min(nextThreshold, estimate);
          pop();
          continue;
        }
        if (frame.inspection.won) {
          if (depth < bestDepth || (depth === bestDepth && frame.extinguishes < bestExtinguishes)) {
            bestPath = [...path];
            bestDepth = depth;
            bestExtinguishes = frame.extinguishes;
          }
          pop();
          continue;
        }
      }

      // Complete the optimal threshold, pruning only branches that cannot improve
      // the proven depth/extinguish pair. Extinguishes never decrease on a suffix.
      if (bestPath !== undefined &&
          (depth >= bestDepth || frame.extinguishes >= bestExtinguishes)) {
        pop();
        continue;
      }
      let pushed = false;
      while (frame.nextCell < model.cells.length) {
        const cell = frame.nextCell++;
        const move = transitionLight(model, frame.state, cell, frame.inspection);
        if (!move.ok || ancestors.has(move.state)) continue;
        path.push(cell);
        ancestors.add(move.state);
        stack.push({
          state: move.state,
          extinguishes: frame.extinguishes + (move.actionType === 'extinguish' ? 1 : 0),
          nextCell: 0,
        });
        pushed = true;
        break;
      }
      if (!pushed) pop();
    }

    if (bestPath !== undefined) {
      return {
        status: 'solved', path: bestPath, optimalMoves: bestDepth,
        minExtinguishesAtOptimal: bestExtinguishes, visitedStates,
      };
    }
    if (nextThreshold === Infinity) return { status: 'unsolvable', visitedStates };
    threshold = nextThreshold;
  }
}
