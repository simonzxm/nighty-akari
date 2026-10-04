import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { Info, HelpCircle, RotateCcw, Undo2 } from 'lucide-react';
import { I18nProvider, useI18n } from './i18n';
import { loadPuzzle, PUZZLE_INDEX } from './data/puzzles';
import { buildBoard, inspectBoard, tryToggleLight } from './engine/core';
import type { PuzzleDefinition, PuzzleIndexEntry } from './engine/types';
import {
  loadAllRecords,
  savePuzzleRecord,
  loadSavedGameState,
  saveGameState,
  clearSavedGameState,
  PuzzleRecord,
} from './utils/storage';
import { createGameTimer, getElapsedMs, pauseGameTimer, resumeGameTimer } from './utils/gameTimer';
import { Board, BoardRejection } from './components/Board';
import { LevelInfoModal } from './components/LevelInfoModal';
import { ArchiveModal } from './components/ArchiveModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';

type AppProps = { initialPuzzle: PuzzleDefinition };

const GameMain: React.FC<AppProps> = ({ initialPuzzle }) => {
  const { t } = useI18n();

  // Active puzzle
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleDefinition>(initialPuzzle);
  const selectionRequest = useRef(0);
  const model = useMemo(() => buildBoard(currentPuzzle), [currentPuzzle]);

  // Validate the full saved game once so board, timer and history restore together.
  const [initialSaved] = useState(() => loadSavedGameState(initialPuzzle, model));
  const [state, setState] = useState<bigint>(() =>
    initialSaved ? BigInt(initialSaved.stateHex) : model.initialState
  );
  const [history, setHistory] = useState<Array<{ state: bigint; moves: number }>>(() =>
    initialSaved ? initialSaved.historyHex.map((hex, moves) => ({ state: BigInt(hex), moves })) : []
  );
  const [moves, setMoves] = useState<number>(initialSaved?.moves ?? 0);
  const [hasStarted, setHasStarted] = useState(initialSaved?.hasStarted ?? false);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.floor((initialSaved?.elapsedMs ?? 0) / 1000));
  const timer = useRef(createGameTimer(initialSaved?.hasStarted, initialSaved?.elapsedMs));
  const victoryHandled = useRef(false);

  // Solved records
  const [records, setRecords] = useState<Record<number, PuzzleRecord>>(() => loadAllRecords(PUZZLE_INDEX));

  // Unified Level Info / Victory modal opens automatically on start
  const [isLevelInfoOpen, setIsLevelInfoOpen] = useState(true);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [rejection, setRejection] = useState<BoardRejection | null>(null);
  const rejectionTimeout = useRef<number | null>(null);

  // Board inspection
  const inspection = useMemo(() => inspectBoard(model, state), [model, state]);

  // Lifecycle callbacks and async puzzle loading always save the latest committed board.
  const latestGame = useRef({ currentPuzzle, state, moves, history, won: inspection.won });
  const persistCurrentGame = useCallback(() => {
    const game = latestGame.current;
    if (game.won) {
      clearSavedGameState(game.currentPuzzle);
      return;
    }
    saveGameState({
      puzzleId: game.currentPuzzle.id,
      hash: game.currentPuzzle.hash,
      stateHex: `0x${game.state.toString(16)}`,
      moves: game.moves,
      hasStarted: timer.current.hasStarted,
      elapsedMs: getElapsedMs(timer.current),
      historyHex: game.history.map((h) => `0x${h.state.toString(16)}`),
    });
  }, []);

  useLayoutEffect(() => {
    latestGame.current = { currentPuzzle, state, moves, history, won: inspection.won };
    if (inspection.won && !victoryHandled.current) {
      victoryHandled.current = true;
      pauseGameTimer(timer.current);
      const finalTime = Math.max(1, Math.floor(timer.current.elapsedMs / 1000));
      setElapsedSeconds(finalTime);
      setSessionActive(false);
      savePuzzleRecord(currentPuzzle, moves, finalTime);
      setRecords(loadAllRecords(PUZZLE_INDEX));
      setIsLevelInfoOpen(true);
    }
    persistCurrentGame();
  }, [currentPuzzle, state, moves, history, inspection.won, hasStarted, sessionActive, persistCurrentGame]);

  // Switch only after loading succeeds; the previous puzzle keeps running while loading.
  const switchPuzzle = useCallback(async (entry: PuzzleIndexEntry) => {
    const request = ++selectionRequest.current;
    let newPuzzle: PuzzleDefinition;
    try {
      newPuzzle = await loadPuzzle(entry);
    } catch (error) {
      console.error('Unable to load selected puzzle:', error);
      return;
    }
    if (request !== selectionRequest.current) return;
    const newModel = buildBoard(newPuzzle);
    pauseGameTimer(timer.current);
    persistCurrentGame();
    const saved = loadSavedGameState(newPuzzle, newModel);
    timer.current = createGameTimer(saved?.hasStarted, saved?.elapsedMs);
    victoryHandled.current = false;
    setCurrentPuzzle(newPuzzle);
    setState(saved ? BigInt(saved.stateHex) : newModel.initialState);
    setMoves(saved?.moves ?? 0);
    setHasStarted(saved?.hasStarted ?? false);
    setSessionActive(false);
    setHistory(saved ? saved.historyHex.map((hex, moves) => ({ state: BigInt(hex), moves })) : []);
    setElapsedSeconds(Math.floor((saved?.elapsedMs ?? 0) / 1000));
    setRecords(loadAllRecords(PUZZLE_INDEX));
    setRejection(null);
    setIsArchiveOpen(false);
    setIsHowToPlayOpen(false);
    setIsResetConfirmOpen(false);
    setIsLevelInfoOpen(true);
  }, [persistCurrentGame]);

  const handleStart = useCallback(() => {
    if (inspection.won) return;
    timer.current.hasStarted = true;
    if (document.visibilityState === 'visible') resumeGameTimer(timer.current);
    setHasStarted(true);
    setSessionActive(true);
    setIsLevelInfoOpen(false);
    persistCurrentGame();
  }, [inspection.won, persistCurrentGame]);

  // In-game dialogs do not pause. Only leaving the page stops the active segment.
  useEffect(() => {
    const pause = () => {
      pauseGameTimer(timer.current);
      if (!latestGame.current.won) setElapsedSeconds(Math.floor(timer.current.elapsedMs / 1000));
      persistCurrentGame();
    };
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        pause();
      } else if (sessionActive && !latestGame.current.won) {
        resumeGameTimer(timer.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', pause);
    window.addEventListener('pageshow', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('pageshow', handleVisibility);
    };
  }, [sessionActive, persistCurrentGame]);

  useEffect(() => {
    if (!sessionActive || inspection.won) return;
    const interval = window.setInterval(() => {
      if (timer.current.runningSince === null) return;
      setElapsedSeconds(Math.floor(getElapsedMs(timer.current) / 1000));
      persistCurrentGame();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionActive, inspection.won, persistCurrentGame]);

  useEffect(() => {
    return () => {
      if (rejectionTimeout.current !== null) {
        window.clearTimeout(rejectionTimeout.current);
      }
    };
  }, []);

  // Handle cell click / toggle
  const handleToggleCell = useCallback(
    (cellIndex: number) => {
      if (inspection.won || !sessionActive || timer.current.runningSince === null) {
        setIsLevelInfoOpen(true);
        return;
      }

      const result = tryToggleLight(model, state, cellIndex);

      if (!result.ok) {
        if (
          result.reasonKey === 'seed_permanent' ||
          result.reasonKey === 'not_illuminated' ||
          result.reasonKey === 'wall_limit_exceeded'
        ) {
          if (rejectionTimeout.current !== null) {
            window.clearTimeout(rejectionTimeout.current);
          }
          setRejection({
            cellIndex,
            reason: result.reasonKey,
            wallIndex: result.wallIndex,
            id: Date.now(),
          });
          rejectionTimeout.current = window.setTimeout(() => {
            setRejection(null);
            rejectionTimeout.current = null;
          }, 300);
        }
        return;
      }

      // Valid move; only the explicit start/continue action starts the timer.
      setHistory((prev) => [...prev, { state, moves }]);
      setState(result.state);
      setMoves((m) => m + 1);
    },
    [inspection.won, model, state, moves, sessionActive]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0 || inspection.won || !sessionActive || timer.current.runningSince === null) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setState(previous.state);
    setMoves(previous.moves);
  }, [history, inspection.won, sessionActive]);

  // Resetting an unfinished board keeps its timer; a completed board starts a new round.
  const handleRestart = useCallback(() => {
    setState(model.initialState);
    setHistory([]);
    setMoves(0);
    setRejection(null);
    if (inspection.won) {
      timer.current = createGameTimer();
      timer.current.hasStarted = true;
      if (document.visibilityState === 'visible') resumeGameTimer(timer.current);
      victoryHandled.current = false;
      setHasStarted(true);
      setSessionActive(true);
      setElapsedSeconds(0);
      setIsLevelInfoOpen(false);
    }
  }, [inspection.won, model.initialState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        setIsLevelInfoOpen(false);
        setIsArchiveOpen(false);
        setIsHowToPlayOpen(false);
        setIsResetConfirmOpen(false);
      } else if (e.key === 'i' || e.key === 'I') {
        setIsLevelInfoOpen((v) => !v);
      } else if (e.key === '?') {
        setIsHowToPlayOpen((v) => !v);
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        handleUndo();
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
          setIsResetConfirmOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060608] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.035)_0%,rgba(0,0,0,0)_65%)] text-zinc-100 flex flex-col items-center justify-center selection:bg-amber-400 selection:text-black">
      {/* 4 Corner Icon Buttons with NO background */}
      {/* Top-Left: Level Info, Settlement & Archive */}
      <button
        type="button"
        onClick={() => setIsLevelInfoOpen(true)}
        title={t.about}
        aria-label={t.about}
        className="fixed top-3 left-3 sm:top-5 sm:left-5 z-20 p-2 text-zinc-400 hover:text-white active:scale-90 transition-all duration-150 cursor-pointer bg-transparent border-0 outline-none select-none"
      >
        <Info className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
      </button>

      {/* Top-Right: Game Rules */}
      <button
        type="button"
        onClick={() => setIsHowToPlayOpen(true)}
        title={t.howToPlay}
        aria-label={t.howToPlay}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-20 p-2 text-zinc-400 hover:text-white active:scale-90 transition-all duration-150 cursor-pointer bg-transparent border-0 outline-none select-none"
      >
        <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
      </button>

      {/* Bottom-Left: Restart Level */}
      <button
        type="button"
        onClick={() => setIsResetConfirmOpen(true)}
        title={t.restart}
        aria-label={t.restart}
        className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-20 p-2 text-zinc-400 hover:text-white active:scale-90 transition-all duration-150 cursor-pointer bg-transparent border-0 outline-none select-none"
      >
        <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
      </button>

      {/* Bottom-Right: Undo Move */}
      <button
        type="button"
        onClick={handleUndo}
        disabled={history.length === 0 || inspection.won || !sessionActive}
        title={t.undo}
        aria-label={t.undo}
        className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-20 p-2 text-zinc-400 hover:text-white active:scale-90 transition-all duration-150 disabled:opacity-25 disabled:hover:text-zinc-400 disabled:cursor-not-allowed cursor-pointer bg-transparent border-0 outline-none select-none"
      >
        <Undo2 className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
      </button>

      {/* Center Board: Pure and text-free */}
      <main className="w-full h-full flex items-center justify-center p-4">
        <Board
          model={model}
          state={state}
          inspection={inspection}
          onToggleCell={handleToggleCell}
          isWon={inspection.won}
          rejection={rejection}
        />
      </main>

      {/* Unified Level Info & Settlement Modal */}
      <LevelInfoModal
        isOpen={isLevelInfoOpen}
        onClose={() => setIsLevelInfoOpen(false)}
        puzzle={currentPuzzle}
        isWon={inspection.won}
        hasStarted={hasStarted}
        onStart={handleStart}
        moves={moves}
        timeSeconds={elapsedSeconds}
        record={records[currentPuzzle.id]}
        onOpenArchive={() => {
          setIsLevelInfoOpen(false);
          setIsArchiveOpen(true);
        }}
        onRestart={handleRestart}
      />

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        currentPuzzleId={currentPuzzle.id}
        onSelectPuzzle={switchPuzzle}
        records={records}
      />

      {/* How To Play Rules Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        keepsTime={!inspection.won}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleRestart}
      />
    </div>
  );
};

export const App: React.FC<AppProps> = ({ initialPuzzle }) => {
  return (
    <I18nProvider>
      <GameMain initialPuzzle={initialPuzzle} />
    </I18nProvider>
  );
};

export default App;
