import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { I18nProvider, useI18n } from './i18n';
import { getDailyPuzzle } from './utils/daily';
import { buildBoard, inspectBoard, tryToggleLight } from './engine/core';
import { PuzzleDefinition } from './engine/types';
import {
  loadAllRecords,
  savePuzzleRecord,
  loadSavedGameState,
  saveGameState,
  clearSavedGameState,
  PuzzleRecord,
} from './utils/storage';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { Toast } from './components/Toast';
import { VictoryModal } from './components/VictoryModal';
import { ArchiveModal } from './components/ArchiveModal';
import { HowToPlayModal } from './components/HowToPlayModal';

const GameMain: React.FC = () => {
  const { t } = useI18n();

  // Active puzzle
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleDefinition>(() => getDailyPuzzle());
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
  const [records, setRecords] = useState<Record<string, PuzzleRecord>>(() => loadAllRecords());

  // Modals & toast
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Board inspection
  const inspection = useMemo(() => inspectBoard(model, state), [model, state]);

  // Sync state when puzzle changes
  const switchPuzzle = useCallback((newPuzzle: PuzzleDefinition) => {
    setCurrentPuzzle(newPuzzle);
    const newModel = buildBoard(newPuzzle);
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
        return;
      } catch {}
    }

    setState(newModel.initialState);
    setMoves(0);
    setStartTime(null);
    setHistory([]);
    setElapsedSeconds(0);
  }, []);

  // Timer running silently in background
  useEffect(() => {
    if (!startTime || inspection.won) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, inspection.won]);

  // Handle victory detection
  useEffect(() => {
    if (inspection.won) {
      const finalTime = startTime ? Math.max(1, Math.floor((Date.now() - startTime) / 1000)) : 1;
      setElapsedSeconds(finalTime);

      const record: PuzzleRecord = {
        puzzleId: currentPuzzle.id,
        puzzleNumber: currentPuzzle.number,
        completed: true,
        moves,
        timeSeconds: finalTime,
        completedAt: new Date().toISOString(),
      };

      savePuzzleRecord(record);
      setRecords((prev) => ({ ...prev, [currentPuzzle.id]: record }));
      setIsVictoryOpen(true);
    }
  }, [inspection.won, currentPuzzle, moves, startTime]);

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
        setIsVictoryOpen(true);
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
    setIsVictoryOpen(false);
  }, [currentPuzzle.id, model.initialState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        setIsVictoryOpen(false);
        setIsArchiveOpen(false);
        setIsHowToPlayOpen(false);
      } else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        handleUndo();
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
          handleRestart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRestart]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Daily Akari Minimalist Header */}
      <Header
        puzzle={currentPuzzle}
        canUndo={history.length > 0 && !inspection.won}
        onUndo={handleUndo}
        onRestart={handleRestart}
        onOpenArchive={() => setIsArchiveOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
      />

      {/* Main Focus Area: Pure, uncluttered board */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <Board
          model={model}
          state={state}
          inspection={inspection}
          onToggleCell={handleToggleCell}
          isWon={inspection.won}
        />
      </main>

      {/* Subtle, minimal footer */}
      <footer className="w-full py-4 text-center text-xs text-zinc-400 font-mono tracking-wider">
        <span>NIGHTY AKARI · LIGHT UP THE NIGHT</span>
      </footer>

      {/* Toast for error or feedback */}
      <Toast message={toastMessage} onClear={() => setToastMessage(null)} />

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        puzzle={currentPuzzle}
        moves={moves}
        timeSeconds={elapsedSeconds}
      />

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        currentPuzzleId={currentPuzzle.id}
        onSelectPuzzle={switchPuzzle}
        records={records}
      />

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <GameMain />
    </I18nProvider>
  );
};

export default App;
