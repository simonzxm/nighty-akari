import React from 'react';
import { X } from 'lucide-react';
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

  // Only released puzzles (on or before today, or already played), sorted descending (newest on top)
  const availablePuzzles = DAILY_PUZZLES.filter(
    (p) => p.date <= todayStr || !!records[p.id]?.completed
  ).sort((a, b) => b.number - a.number);

  const totalCompleted = availablePuzzles.filter((p) => records[p.id]?.completed).length;

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm max-h-[80vh] bg-[#0f0f12] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col text-zinc-200 relative">
        {/* Clean Header: No divider border */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span className="text-amber-300 text-sm">✦</span>
              <span>{t.archiveTitle}</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              {totalCompleted} / {availablePuzzles.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Minimalist List: No nested boxes, clean hover rows */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1 pr-1">
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
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Clean glyph without square boxes */}
                  <span
                    className={`font-mono text-sm w-5 text-center shrink-0 ${
                      isOptimal
                        ? 'text-amber-400 font-bold'
                        : isSolved
                        ? 'text-emerald-400 font-bold'
                        : isCurrent
                        ? 'text-white font-bold'
                        : 'text-zinc-600'
                    }`}
                  >
                    {isOptimal ? '★' : isSolved ? '✓' : puzzle.number}
                  </span>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-white">
                        {t.dailyNo(puzzle.number)}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-400 font-mono">
                        {formatGameDate(puzzle.date, lang)}
                      </span>
                      {isToday && (
                        <span className="text-[10px] text-amber-300/80 font-mono">
                          ({lang === 'zh' ? '今日' : 'Today'})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {getDifficultyText(puzzle.difficulty)}
                    </div>
                  </div>
                </div>

                {/* Right: Solved moves or dash */}
                <div className="text-right">
                  {isSolved ? (
                    <span
                      className={`text-xs font-mono font-medium ${
                        isOptimal ? 'text-amber-400' : 'text-zinc-400'
                      }`}
                    >
                      {record.moves} {lang === 'zh' ? '步' : 'moves'}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-700 font-mono">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
