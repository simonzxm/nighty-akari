import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Copy, Check, Sparkles, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { PuzzleDefinition } from '../engine/types';
import { formatGameDate } from '../utils/daily';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleDefinition;
  moves: number;
  timeSeconds: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  puzzle,
  moves,
  timeSeconds,
}) => {
  const { lang, t } = useI18n();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Soft confetti burst with golden/amber night lights palette
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#facc15', '#fef08a', '#eab308', '#ffffff'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeSeconds / 60);
  const seconds = timeSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isOptimal = moves <= puzzle.optimalMoves;

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
      // Fallback
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0d0d10] border border-amber-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl text-center text-zinc-100 relative shadow-amber-500/10">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        <h3 className="text-xl font-bold tracking-tight text-zinc-100">
          {t.victoryTitle}
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          {t.dailyNo(puzzle.number)} · {formatGameDate(puzzle.date, lang)}
        </p>

        {isOptimal && (
          <div className="mt-3 py-1 px-3 bg-amber-400/15 border border-amber-400/40 rounded-full inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium">
            <span>★</span>
            <span>{t.victoryOptimal}</span>
          </div>
        )}

        {/* Clean minimal stats presentation */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl">
            <span className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1">
              {t.timeLabel}
            </span>
            <strong className="text-xl font-mono font-semibold text-zinc-100">
              {timeFormatted}
            </strong>
          </div>
          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl">
            <span className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1">
              {t.movesLabel}
            </span>
            <strong className="text-xl font-mono font-semibold text-zinc-100">
              {moves}
              <span className="text-xs text-zinc-400 font-normal ml-1">
                / {puzzle.optimalMoves}
              </span>
            </strong>
          </div>
        </div>

        {/* Single primary action: Copy Result */}
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            copied
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20'
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
      </div>
    </div>
  );
};
