import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Languages,
  Calendar,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { PuzzleDefinition } from '../engine/types';
import { PuzzleRecord } from '../utils/storage';
import { formatGameDate } from '../utils/daily';

interface LevelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleDefinition;
  isWon: boolean;
  moves: number;
  timeSeconds: number;
  record?: PuzzleRecord;
  onOpenArchive: () => void;
  onRestart: () => void;
}

export const LevelInfoModal: React.FC<LevelInfoModalProps> = ({
  isOpen,
  onClose,
  puzzle,
  isWon,
  moves,
  timeSeconds,
  record,
  onOpenArchive,
  onRestart,
}) => {
  const { lang, setLang, t } = useI18n();
  const [copied, setCopied] = useState(false);

  // Trigger confetti on win
  useEffect(() => {
    if (isOpen && isWon) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#facc15', '#fef08a'],
        });
      } catch {}
    }
  }, [isOpen, isWon]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeSeconds / 60);
  const seconds = timeSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isOptimal = moves <= puzzle.optimalMoves;

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'zh' : 'en');
  };

  const handleCopy = async () => {
    const url = window.location.origin + window.location.pathname;
    const text = t.shareText(
      puzzle.number,
      puzzle.date,
      timeFormatted,
      moves,
      puzzle.optimalMoves,
      url
    );

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const difficultyText =
    puzzle.difficulty === 'easy'
      ? t.difficultyEasy
      : puzzle.difficulty === 'medium'
      ? t.difficultyMedium
      : t.difficultyHard;

  const difficultyColor =
    puzzle.difficulty === 'easy'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : puzzle.difficulty === 'medium'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xs sm:max-w-sm bg-[#0c0c0f] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-center text-zinc-100 relative shadow-black/80 flex flex-col">
        {/* Top Control Bar: Language & Close */}
        <div className="flex items-center justify-between pb-2 -mt-1 -mx-1">
          <button
            type="button"
            onClick={toggleLanguage}
            title={t.language}
            aria-label={t.language}
            className="px-2.5 py-1 text-xs font-mono font-medium text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 hover:bg-zinc-800/80 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? '中' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-800/80 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unified Header: Icon, Number, Date, Difficulty (No titles or subtitles) */}
        <div className="pt-1 pb-2">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-white">
            {isWon ? (
              <Sparkles className="w-5 h-5 text-amber-300" />
            ) : (
              <span className="text-2xl leading-none">✦</span>
            )}
          </div>

          <div className="text-xl font-bold tracking-tight text-white mb-1">
            {t.dailyNo(puzzle.number)}
          </div>

          <div className="text-xs text-zinc-400 font-mono mb-2.5">
            {formatGameDate(puzzle.date, lang)}
          </div>

          {/* Difficulty badge */}
          <div className="inline-block">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${difficultyColor}`}
            >
              {difficultyText}
            </span>
          </div>
        </div>

        {/* Stats & Status Area (Clean typography without card boxes) */}
        {isWon ? (
          <div className="pt-2 pb-4">
            {/* Won Status Indicator */}
            <div className="mt-1 mb-4">
              {isOptimal ? (
                <div className="text-xs text-amber-400 font-medium inline-flex items-center gap-1.5">
                  <span>★</span>
                  <span>{t.victoryOptimal}</span>
                </div>
              ) : (
                <div className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1.5">
                  <span>✓</span>
                  <span>{t.victoryGood}</span>
                </div>
              )}
            </div>

            {/* Revealed Stats: Time & Moves (Optimal benchmark revealed only here) */}
            <div className="flex items-center justify-center gap-8 py-3 my-2 border-y border-zinc-800/80">
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
                  {t.timeLabel}
                </div>
                <div className="text-2xl font-mono font-semibold text-white">
                  {timeFormatted}
                </div>
              </div>

              <div className="w-px h-8 bg-zinc-800" />

              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
                  {t.movesLabel}
                </div>
                <div className="text-2xl font-mono font-semibold text-white">
                  {moves}
                  <span className="text-xs text-zinc-500 font-normal ml-1 font-mono">
                    / {puzzle.optimalMoves}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Copy Result & Play Again */}
            <div className="space-y-2.5 mt-5">
              <button
                type="button"
                onClick={handleCopy}
                className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 select-none shadow-lg cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                    : 'bg-white hover:bg-zinc-200 text-black shadow-white/10 active:scale-[0.98]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.copiedNotice}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.copyResult}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onRestart();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.playAgain}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 pb-4">
            {/* If previously completed, display past best record (no spoiler on optimal moves) */}
            {record?.completed ? (
              <div className="py-2.5 my-2 border-y border-zinc-800/80">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">
                  {t.previouslySolved}
                </div>
                <div className="font-mono text-sm text-zinc-200 flex items-center justify-center gap-1.5">
                  {record.moves <= puzzle.optimalMoves ? (
                    <span className="text-amber-400 font-semibold inline-flex items-center gap-1">
                      <span>★</span> {record.moves} {lang === 'zh' ? '步' : 'moves'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                      <span>✓</span> {record.moves} {lang === 'zh' ? '步' : 'moves'}
                    </span>
                  )}
                </div>
              </div>
            ) : moves > 0 ? (
              /* In progress stats */
              <div className="flex items-center justify-center gap-8 py-3 my-2 border-y border-zinc-800/80">
                <div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
                    {t.timeLabel}
                  </div>
                  <div className="text-2xl font-mono font-semibold text-white">
                    {timeFormatted}
                  </div>
                </div>

                <div className="w-px h-8 bg-zinc-800" />

                <div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
                    {t.movesLabel}
                  </div>
                  <div className="text-2xl font-mono font-semibold text-white">
                    {moves}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-6" />
            )}

            {/* Action Buttons: Play / Resume (and Restart if moves > 0) */}
            <div className="space-y-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition-all select-none shadow-lg shadow-white/10 active:scale-[0.98] cursor-pointer"
              >
                {moves > 0 ? t.resume : t.play}
              </button>

              {moves > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onRestart();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.restart}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Bottom: Archive Entrance */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenArchive();
            }}
            className="w-full py-2 px-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.archive}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
