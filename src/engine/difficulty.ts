import type { PuzzleDefinition } from './types';

// Includes the solver/metric version so cached analysis can be invalidated on changes.
export const ANALYSIS_VERSION = 2;

type Metrics = {
  optimalMoves: number;
  minExtinguishesAtOptimal: number;
  whiteCells: number;
};

/** Deterministic heuristic with authored score thresholds, not player-based calibration. */
export function rateDifficulty(metrics: Metrics): { score: number; difficulty: PuzzleDefinition['difficulty'] } {
  const score = metrics.optimalMoves
    + 2 * metrics.minExtinguishesAtOptimal
    + Math.max(0, Math.ceil(metrics.whiteCells / 10) - 2);
  return { score, difficulty: score < 15 ? 'easy' : score < 30 ? 'medium' : 'hard' };
}
