export interface GameTimer {
  hasStarted: boolean;
  elapsedMs: number;
  runningSince: number | null;
}

export function createGameTimer(hasStarted = false, elapsedMs = 0): GameTimer {
  return { hasStarted, elapsedMs, runningSince: null };
}

export function getElapsedMs(timer: GameTimer, now = performance.now()): number {
  return timer.elapsedMs + (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince));
}

export function resumeGameTimer(timer: GameTimer, now = performance.now()): void {
  timer.hasStarted = true;
  if (timer.runningSince === null) timer.runningSince = now;
}

export function pauseGameTimer(timer: GameTimer, now = performance.now()): void {
  timer.elapsedMs = getElapsedMs(timer, now);
  timer.runningSince = null;
}
