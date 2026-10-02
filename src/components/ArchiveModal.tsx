import React from 'react';
import { X, Moon } from 'lucide-react';
import { useI18n } from '../i18n';
import { PUZZLE_INDEX } from '../data/puzzles';
import type { PuzzleIndexEntry, PuzzleMetadata } from '../engine/types';
import { PuzzleRecord } from '../utils/storage';
import { formatGameDate, getTodayDateString } from '../utils/daily';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzleId: number;
  onSelectPuzzle: (puzzle: PuzzleIndexEntry) => Promise<void>;
  records: Record<number, PuzzleRecord>;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  currentPuzzleId,
  onSelectPuzzle,
  records,
}) => {
  const { lang, t } = useI18n();

  if (!isOpen) return null;

  const todayStr = getTodayDateString();

  // Development shows all authored puzzles; production shows released puzzles only.
  const availablePuzzles = PUZZLE_INDEX.filter(
    (p) => import.meta.env.DEV || p.date <= todayStr
  ).sort((a, b) => b.id - a.id);

  const totalCompleted = availablePuzzles.filter((p) => Boolean(records[p.id])).length;

  const getDifficultyText = (diff: PuzzleMetadata['difficulty']) => {
    switch (diff) {
      case 'easy':
        return t.difficultyEasy;
      case 'medium':
        return t.difficultyMedium;
      case 'hard':
        return t.difficultyHard;
      default:
        return diff;
    }
  };

  const formatTime = (timeSec: number) => {
    const mins = Math.floor(timeSec / 60);
    const secs = timeSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm max-h-[80vh] bg-[#0f0f14] rounded-3xl p-5 sm:p-6 border border-zinc-800 shadow-2xl flex flex-col text-zinc-200 relative">
        {/* Header without dividers */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-300 fill-amber-300/20 shrink-0" strokeWidth={1.75} />
              <span>{t.archiveTitle}</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              {totalCompleted} / {availablePuzzles.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean, balanced archive list without redundant left icons */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1.5 pr-1">
          {availablePuzzles.map((puzzle) => {
            const isCurrent = puzzle.id === currentPuzzleId;
            const record = records[puzzle.id];
            const isSolved = Boolean(record);
            const solveMoves = record?.moves ?? 0;
            const solveTime = record?.timeSeconds ?? 0;
            const isOptimal = isSolved && solveMoves <= puzzle.optimalMoves;
            const isToday = puzzle.date === todayStr;

            return (
              <button
                key={puzzle.id}
                type="button"
                onClick={() => { void onSelectPuzzle(puzzle); }}
                className={`w-full px-3.5 py-3 rounded-2xl flex flex-col gap-1 text-left transition-all cursor-pointer select-none ${
                  isCurrent
                    ? 'bg-white/10 ring-1 ring-white/15 text-white'
                    : 'text-zinc-200 hover:bg-white/5 active:bg-white/10'
                }`}
              >
                {/* Row 1: Issue Title & Today on Left, Solved Moves / Status on Right */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-white text-xs sm:text-[13px] truncate">
                      {t.dailyNo(puzzle.id)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] text-amber-300 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded-full shrink-0">
                        {lang === 'zh' ? '今日' : 'Today'}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 text-right ml-2">
                    {isSolved ? (
                      <span
                        className={`text-xs font-mono font-semibold ${
                          isOptimal ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {isOptimal ? '★ ' : '✓ '}
                        {solveMoves} {lang === 'zh' ? (isOptimal ? '步 (最优)' : '步') : 'moves'}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 font-mono">
                        {t.archiveStatusUnsolved}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Date & Difficulty on Left, Solved Time on Right */}
                <div className="flex items-center justify-between w-full text-[11px] text-zinc-300 font-mono">
                  <div className="truncate">
                    <span>{formatGameDate(puzzle.date, lang)}</span>
                    <span className="mx-1.5 text-zinc-500">·</span>
                    <span className="text-zinc-300">{getDifficultyText(puzzle.difficulty)}</span>
                  </div>

                  <div className="shrink-0 text-right ml-2 text-zinc-300">
                    {isSolved ? (
                      <span>{formatTime(solveTime)}</span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
