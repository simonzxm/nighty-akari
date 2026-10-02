import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Languages, Calendar, RotateCcw, Copy, Check, Play, Moon } from 'lucide-react';
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

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'zh' : 'en');
  };

  const difficultyText =
    puzzle.difficulty === 'easy'
      ? t.difficultyEasy
      : puzzle.difficulty === 'medium'
      ? t.difficultyMedium
      : t.difficultyHard;

  // Determine whether this level has a completed record to show (either won right now or previously won)
  const hasCompletedRecord = isWon || Boolean(record);

  // If completed (now or in the past), show the best completed record stats.
  // Otherwise, show current in-progress stats with theoretical moves masked as "?".
  const statMoves = isWon
    ? moves
    : record
    ? record.moves
    : moves;

  const statTimeSeconds = isWon
    ? timeSeconds
    : record
    ? record.timeSeconds
    : timeSeconds;

  const mins = Math.floor(statTimeSeconds / 60);
  const secs = statTimeSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isOptimal = hasCompletedRecord && statMoves <= puzzle.optimalMoves;

  const handleCopy = async () => {
    const url = window.location.origin + window.location.pathname;
    const text = t.shareText(
      puzzle.id,
      puzzle.date,
      timeFormatted,
      statMoves,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xs bg-[#0f0f12] rounded-3xl p-6 sm:p-7 shadow-2xl text-center text-zinc-100 relative flex flex-col">
        {/* Top Control Bar: Lang & Close */}
        <div className="flex items-center justify-between pb-2">
          <button
            type="button"
            onClick={toggleLanguage}
            title={t.language}
            aria-label={t.language}
            className="text-xs font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-1 cursor-pointer py-1 px-1.5"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? '中' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Header: Celestial Moon Icon, Number, Date, Difficulty */}
        <div className="pt-2 pb-1">
          <Moon className="w-7 h-7 text-amber-300/90 fill-amber-300/20 mx-auto mb-2 stroke-[1.75]" />
          <div className="text-2xl font-bold tracking-tight text-white mb-1">
            {t.dailyNo(puzzle.id)}
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            {formatGameDate(puzzle.date, lang)} · {difficultyText}
          </div>
        </div>

        {/* Stats Section: Unified layout matching settlement screen */}
        <div className="pt-4 pb-2">
          {/* Status Badge */}
          <div className="text-xs font-medium mb-4">
            {hasCompletedRecord ? (
              isOptimal ? (
                <span className="text-amber-400">★ {t.victoryOptimal}</span>
              ) : (
                <span className="text-emerald-400">✓ {t.victoryGood}</span>
              )
            ) : moves > 0 ? (
              <span className="text-amber-300/80">{t.inProgress}</span>
            ) : (
              <span className="text-zinc-500">{t.notStarted}</span>
            )}
          </div>

          {/* Time & Moves Numbers */}
          <div className="flex justify-center gap-10 my-4">
            <div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">
                {t.timeLabel}
              </div>
              <div className="text-2xl font-mono font-semibold text-white">
                {timeFormatted}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">
                {t.movesLabel}
              </div>
              <div className="text-2xl font-mono font-semibold text-white">
                {statMoves}
                <span className="text-xs text-zinc-500 font-normal ml-1 font-mono">
                  / {hasCompletedRecord ? puzzle.optimalMoves : '?'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: No restart buttons here */}
          <div className="space-y-2 mt-6">
            {hasCompletedRecord ? (
              <>
                {/* Copy Result Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 select-none cursor-pointer ${
                    copied
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white hover:bg-zinc-200 text-black active:scale-[0.98]'
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

                {/* Secondary Button */}
                {isWon ? (
                  <button
                    type="button"
                    onClick={() => {
                      onRestart();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.playAgain}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 px-4 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{moves > 0 ? t.resume : t.play}</span>
                  </button>
                )}
              </>
            ) : (
              /* Primary Start / Resume Button when not completed yet */
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium text-sm transition-all select-none active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{moves > 0 ? t.resume : t.play}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Bottom: Past Puzzles / Archive */}
        <div className="mt-4 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenArchive();
            }}
            className="w-full py-2 text-zinc-500 hover:text-white text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.archive}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
