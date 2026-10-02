import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Languages, Calendar, RotateCcw, Copy, Check } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xs bg-[#0f0f12] rounded-3xl p-6 sm:p-7 shadow-2xl text-center text-zinc-100 relative flex flex-col">
        {/* Top Control Bar: Lang & Close without borders */}
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

        {/* Clean Header: Pure Star, Number, Date, Difficulty (No frames, no pills) */}
        <div className="pt-2 pb-1">
          <div className="text-3xl text-amber-300 mb-2 leading-none">✦</div>
          <div className="text-2xl font-bold tracking-tight text-white mb-1">
            {t.dailyNo(puzzle.number)}
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            {formatGameDate(puzzle.date, lang)} · {difficultyText}
          </div>
        </div>

        {/* Stats Section: Pure Typography, Zero Divider Lines */}
        {isWon ? (
          <div className="pt-4 pb-2">
            <div className="text-xs font-medium mb-4">
              {isOptimal ? (
                <span className="text-amber-400">★ {t.victoryOptimal}</span>
              ) : (
                <span className="text-emerald-400">✓ {t.victoryGood}</span>
              )}
            </div>

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
                  {moves}
                  <span className="text-xs text-zinc-500 font-normal ml-1 font-mono">
                    / {puzzle.optimalMoves}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 mt-6">
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
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-2">
            {record?.completed ? (
              <div className="my-5 text-sm font-mono">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">
                  {t.previouslySolved}
                </span>
                {record.moves <= puzzle.optimalMoves ? (
                  <span className="text-amber-400 font-semibold">
                    ★ {record.moves} {lang === 'zh' ? '步' : 'moves'}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    ✓ {record.moves} {lang === 'zh' ? '步' : 'moves'}
                  </span>
                )}
              </div>
            ) : moves > 0 ? (
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
                    {moves}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-6" />
            )}

            {/* Actions */}
            <div className="space-y-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium text-sm transition-all select-none active:scale-[0.98] cursor-pointer"
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
                  className="w-full py-2.5 px-4 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-white/5 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.restart}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Bottom: Clean Archive text button, NO divider line */}
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
