import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Info, HelpCircle, RotateCcw, Undo2 } from 'lucide-react';
import { I18nProvider, useI18n } from './i18n';
import { loadPuzzle } from './data/puzzles';
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
import { Board } from './components/Board';
import { Toast } from './components/Toast';
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

  // Board state & history
  const [state, setState] = useState<bigint>(() => {
    const saved = loadSavedGameState(currentPuzzle.id);
    if (saved) {
      try {
        return BigInt(saved.stateHex);
      } catch {}
    }
    return model.initialState;
  });

  const [history, setHistory] = useState<Array<{ state: bigint; moves: number }>>(() => {
    const saved = loadSavedGameState(currentPuzzle.id);
    if (saved && saved.historyHex) {
      try {
        return saved.historyHex.map((hex, idx) => ({
          state: BigInt(hex),
          moves: idx,
        }));
      } catch {}
    }
    return [];
  });

  const [moves, setMoves] = useState<number>(() => {
    const saved = loadSavedGameState(currentPuzzle.id);
    return saved ? saved.moves : 0;
  });

  const [startTime, setStartTime] = useState<number | null>(() => {
    const saved = loadSavedGameState(currentPuzzle.id);
    return saved?.startTime || null;
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Solved records
  const [records, setRecords] = useState<Record<number, PuzzleRecord>>(() => loadAllRecords());

  // Unified Level Info / Victory modal opens automatically on start
  const [isLevelInfoOpen, setIsLevelInfoOpen] = useState(true);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Board inspection
  const inspection = useMemo(() => inspectBoard(model, state), [model, state]);

  // Switch puzzle from archive
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
    setCurrentPuzzle(newPuzzle);
    const saved = loadSavedGameState(newPuzzle.id);

    if (saved) {
      try {
        setState(BigInt(saved.stateHex));
        setMoves(saved.moves);
        setStartTime(saved.startTime);
        setHistory(
          (saved.historyHex || []).map((hex, idx) => ({
            state: BigInt(hex),
            moves: idx,
          }))
        );
        setIsArchiveOpen(false);
        setIsResetConfirmOpen(false);
        setIsLevelInfoOpen(true);
        return;
      } catch {}
    }

    setState(newModel.initialState);
    setMoves(0);
    setStartTime(null);
    setHistory([]);
    setElapsedSeconds(0);
    setIsArchiveOpen(false);
    setIsResetConfirmOpen(false);
    setIsLevelInfoOpen(true);
  }, []);

  // Timer running in background
  useEffect(() => {
    if (!startTime || inspection.won) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, inspection.won]);

  // Handle victory detection: automatically pop up unified settlement modal
  useEffect(() => {
    if (inspection.won) {
      const finalTime = startTime ? Math.max(1, Math.floor((Date.now() - startTime) / 1000)) : 1;
      setElapsedSeconds(finalTime);

      savePuzzleRecord(currentPuzzle.id, moves, finalTime);
      setRecords(loadAllRecords());
      setIsLevelInfoOpen(true);
    }
  }, [inspection.won, currentPuzzle.id, moves, startTime]);

  // Save in-progress state to localStorage
  useEffect(() => {
    if (inspection.won) {
      clearSavedGameState(currentPuzzle.id);
    } else {
      saveGameState({
        puzzleId: currentPuzzle.id,
        stateHex: `0x${state.toString(16)}`,
        moves,
        startTime,
        historyHex: history.map((h) => `0x${h.state.toString(16)}`),
      });
    }
  }, [currentPuzzle.id, state, moves, startTime, history, inspection.won]);

  // Handle cell click / toggle
  const handleToggleCell = useCallback(
    (cellIndex: number) => {
      if (inspection.won) {
        setIsLevelInfoOpen(true);
        return;
      }

      const result = tryToggleLight(model, state, cellIndex);

      if (!result.ok) {
        if (result.reasonKey === 'seed_permanent') {
          setToastMessage(t.errSeedPermanent);
        } else if (result.reasonKey === 'not_illuminated') {
          setToastMessage(t.errNotLit);
        } else if (result.reasonKey === 'wall_limit_exceeded') {
          const badWall = model.walls[result.wallIndex!];
          setToastMessage(t.errWallLimit(badWall.r + 1, badWall.c + 1, badWall.value));
        }
        return;
      }

      // Valid move
      if (startTime === null) {
        setStartTime(Date.now());
      }

      setHistory((prev) => [...prev, { state, moves }]);
      setState(result.state);
      setMoves((m) => m + 1);
    },
    [inspection.won, model, state, moves, startTime, t]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0 || inspection.won) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setState(previous.state);
    setMoves(previous.moves);
  }, [history, inspection.won]);

  // Restart action
  const handleRestart = useCallback(() => {
    clearSavedGameState(currentPuzzle.id);
    setState(model.initialState);
    setHistory([]);
    setMoves(0);
    setStartTime(null);
    setElapsedSeconds(0);
  }, [currentPuzzle.id, model.initialState]);

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
        disabled={history.length === 0 || inspection.won}
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
        />
      </main>

      {/* Toast for error or feedback notifications */}
      <Toast message={toastMessage} onClear={() => setToastMessage(null)} />

      {/* Unified Level Info & Settlement Modal */}
      <LevelInfoModal
        isOpen={isLevelInfoOpen}
        onClose={() => setIsLevelInfoOpen(false)}
        puzzle={currentPuzzle}
        isWon={inspection.won}
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
