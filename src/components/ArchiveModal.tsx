import React from 'react';
import { X, ChevronRight, Lock } from 'lucide-react';
import { useI18n } from '../i18n';
import { DAILY_PUZZLES } from '../data/puzzles';
import { PuzzleDefinition } from '../engine/types';
import { PuzzleRecord } from '../utils/storage';
import { formatGameDate, getTodayDateString } from '../utils/daily';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPuzzleId: string;
  onSelectPuzzle: (puzzle: PuzzleDefinition) => void;
  records: Record<string, PuzzleRecord>;
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

  // Partition puzzles:
  // 1. Available: released on or before today (or already played), sorted descending (newest first)
  // 2. Future: date after today and not completed, sorted ascending (upcoming), locked
  const availablePuzzles = DAILY_PUZZLES.filter(
    (p) => p.date <= todayStr || !!records[p.id]?.completed
  ).sort((a, b) => b.number - a.number);

  const futurePuzzles = DAILY_PUZZLES.filter(
    (p) => p.date > todayStr && !records[p.id]?.completed
  ).sort((a, b) => a.number - b.number);

  const totalCompleted = Object.values(records).filter((r) => r.completed).length;

  const getDifficultyText = (diff: PuzzleDefinition['difficulty']) => {
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

  const getDifficultyColor = (diff: PuzzleDefinition['difficulty']) => {
    switch (diff) {
      case 'easy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'hard':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md max-h-[85vh] bg-[#0c0c0f] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col text-zinc-200 relative shadow-black/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-amber-400 text-sm">✦</span>
              {t.archiveTitle}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              {totalCompleted} / {availablePuzzles.length} {t.archiveStatusSolved}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 mt-1">
          {/* Available / Released Puzzles (Descending) */}
          {availablePuzzles.map((puzzle) => {
            const isCurrent = puzzle.id === currentPuzzleId;
            const record = records[puzzle.id];
            const isSolved = !!record?.completed;
            const isOptimal = isSolved && record.moves <= puzzle.optimalMoves;
            const isToday = puzzle.date === todayStr;

            return (
              <button
                key={puzzle.id}
                type="button"
                onClick={() => {
                  onSelectPuzzle(puzzle);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-400/10 border-amber-400/40 shadow-sm'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Left status badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                      isOptimal
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : isSolved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-white text-black font-bold'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {isOptimal ? '★' : isSolved ? '✓' : puzzle.number}
                  </div>

                  <div>
                    {/* Line 1: No. X + Difficulty Badge + Today Tag */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">
                        {t.dailyNo(puzzle.number)}
                      </span>

                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-medium border ${getDifficultyColor(
                          puzzle.difficulty
                        )}`}
                      >
                        {getDifficultyText(puzzle.difficulty)}
                      </span>

                      {isToday && (
                        <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded text-[10px] font-medium">
                          {lang === 'zh' ? '今日' : 'Today'}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Date + Solved Record */}
                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                      <span>{formatGameDate(puzzle.date, lang)}</span>
                      {isSolved && (
                        <span
                          className={
                            isOptimal
                              ? 'text-amber-400 font-medium'
                              : 'text-emerald-400'
                          }
                        >
                          · {isOptimal ? '★ ' : '✓ '}
                          {record.moves} {lang === 'zh' ? '步' : 'moves'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </button>
            );
          })}

          {/* Future / Locked Puzzles (Separated at bottom) */}
          {futurePuzzles.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider px-1 pb-1.5 font-mono">
                {lang === 'zh' ? '未解锁' : 'Upcoming'}
              </div>

              <div className="space-y-2">
                {futurePuzzles.map((puzzle) => (
                  <div
                    key={puzzle.id}
                    className="w-full p-3 rounded-2xl border border-zinc-900 bg-zinc-950/60 opacity-50 flex items-center justify-between cursor-not-allowed select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center text-xs font-mono text-zinc-600">
                        <Lock className="w-3.5 h-3.5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-zinc-400">
                            {t.dailyNo(puzzle.number)}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-medium border opacity-60 ${getDifficultyColor(
                              puzzle.difficulty
                            )}`}
                          >
                            {getDifficultyText(puzzle.difficulty)}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-600 font-mono mt-0.5">
                          {formatGameDate(puzzle.date, lang)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-600 font-mono pr-1">
                      {t.archiveFutureLocked}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
