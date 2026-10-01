import { BoardModel } from './types';
import { inspectBoard } from './core';

export type SolutionResult = {
  path: number[];
  optimalMoves: number;
  visitedStates: number;
} | null;

/**
 * Breadth-First Search solver to find the optimal (minimum move) solution from a given state.
 */
export function solvePuzzle(m: BoardModel, startState = m.initialState): SolutionResult {
  const queue: bigint[] = [startState];
  const visited = new Set<bigint>([startState]);
  const parentMap = new Map<bigint, { prevState: bigint; cellIndex: number }>();

  let head = 0;

  while (head < queue.length) {
    const currentState = queue[head++];
    const inspection = inspectBoard(m, currentState);

    if (inspection.won) {
      // Reconstruct path
      const path: number[] = [];
      let cur = currentState;
      while (parentMap.has(cur)) {
        const step = parentMap.get(cur)!;
        path.push(step.cellIndex);
        cur = step.prevState;
      }
      path.reverse();
      return {
        path,
        optimalMoves: path.length,
        visitedStates: visited.size,
      };
    }

    // Explore neighbors
    for (let i = 0; i < m.cells.length; i++) {
      if (i === m.seedIndex) continue; // seed cannot be changed

      const bit = 1n << BigInt(i);
      const isOn = (currentState & bit) !== 0n;

      // To place a light, cell must be lit
      if (!isOn && (inspection.litMask & bit) === 0n) {
        continue;
      }

      const nextState = currentState ^ bit;
      if (visited.has(nextState)) {
        continue;
      }

      const nextInspection = inspectBoard(m, nextState);
      if (!nextInspection.valid) {
        continue;
      }

      visited.add(nextState);
      parentMap.set(nextState, { prevState: currentState, cellIndex: i });
      queue.push(nextState);
    }
  }

  return null;
}
