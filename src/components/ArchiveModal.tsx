import React from 'react';
import { X, CheckCircle2, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { DAILY_PUZZLES } from '../data/puzzles';
import { PuzzleDefinition } from '../engine/types';
import { PuzzleRecord } from '../utils/storage';
import { formatGameDate } from '../utils/daily';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] bg-[#0d0d10] border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col text-zinc-200 relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100">
              {t.archiveTitle}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {Object.keys(records).length} / {DAILY_PUZZLES.length} {t.archiveStatusSolved}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 mt-2">
          {DAILY_PUZZLES.map((puzzle) => {
            const isCurrent = puzzle.id === currentPuzzleId;
            const record = records[puzzle.id];
            const isSolved = !!record?.completed;

            return (
              <button
                key={puzzle.id}
                type="button"
                onClick={() => {
                  onSelectPuzzle(puzzle);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-800/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isSolved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isSolved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      puzzle.number
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100">
                        {puzzle.name[lang]}
                      </span>
                      {puzzle.subtitle && (
                        <span className="text-xs text-zinc-400 hidden sm:inline">
                          · {puzzle.subtitle[lang]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                      <span>{formatGameDate(puzzle.date, lang)}</span>
                      {isSolved && (
                        <span className="text-emerald-400">
                          {record.moves} moves
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
