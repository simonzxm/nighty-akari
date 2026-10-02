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
  CheckCircle2,
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

  // Trigger celebration confetti on win
  useEffect(() => {
    if (isOpen && isWon) {
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#facc15', '#fef08a', '#ca8a04'],
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0c0c0f] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-center text-zinc-100 relative shadow-black/80 flex flex-col">
        {/* Top bar inside modal: Language Toggle & Close button */}
        <div className="flex items-center justify-between pb-3 -mt-1 -mx-1">
          <button
            type="button"
            onClick={toggleLanguage}
            title={t.language}
            aria-label={t.language}
            className="px-2.5 py-1 text-xs font-mono font-medium text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 hover:bg-zinc-800/80"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? '中' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================== VIEW 1: VICTORY SETTLEMENT ===================== */}
        {isWon ? (
          <div className="py-2 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3.5 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-0.5">
              {t.victoryTitle}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              {t.dailyNo(puzzle.number)} · {formatGameDate(puzzle.date, lang)}
            </p>

            {isOptimal && (
              <div className="mt-3 py-1 px-3 bg-amber-400/15 border border-amber-400/30 rounded-full inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                <span>★</span>
                <span>{t.victoryOptimal}</span>
              </div>
            )}

            {/* Clean minimal stats presentation */}
            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl">
                <span className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1">
                  {t.timeLabel}
                </span>
                <strong className="text-xl font-mono font-semibold text-white">
                  {timeFormatted}
                </strong>
              </div>
              <div className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl">
                <span className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1">
                  {t.movesLabel}
                </span>
                <strong className="text-xl font-mono font-semibold text-white">
                  {moves}
                  <span className="text-xs text-zinc-400 font-normal ml-1 font-mono">
                    / {puzzle.optimalMoves}
                  </span>
                </strong>
              </div>
            </div>

            {/* Primary Action: Copy Result */}
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 select-none shadow-lg ${
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
          </div>
        ) : (
          /* ===================== VIEW 2: LEVEL INFO & START ===================== */
          <div className="py-2 animate-fadeIn">
            {/* Minimalist radiant star icon */}
            <div className="w-12 h-12 rounded-full bg-white/5 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-white">
              <span className="text-2xl leading-none">✦</span>
            </div>

            <div className="text-xs text-amber-400 font-mono tracking-wider uppercase mb-1">
              {t.dailyNo(puzzle.number)}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
              {puzzle.name[lang]}
            </h2>

            {puzzle.subtitle && (
              <p className="text-xs text-zinc-400 mb-2">
                {puzzle.subtitle[lang]}
              </p>
            )}

            <p className="text-xs text-zinc-400 font-mono">
              {formatGameDate(puzzle.date, lang)}
            </p>

            {/* Target information */}
            <div className="my-5 p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-zinc-400">{t.optimalGoal}</span>
              <span className="font-mono font-bold text-white text-sm">
                {puzzle.optimalMoves} {lang === 'zh' ? '步' : 'moves'}
              </span>
            </div>

            {/* If previously solved, show best badge */}
            {record?.completed && (
              <div className="mb-4 py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {t.previouslySolved}: {record.moves} moves
                </span>
              </div>
            )}

            {/* Primary Action: Play / Resume */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition-all select-none shadow-lg shadow-white/10 active:scale-[0.98]"
            >
              {moves > 0 ? t.resume : t.play}
            </button>
          </div>
        )}

        {/* Modal Bottom Actions: Archive Entrance & Reset */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenArchive();
            }}
            className="flex-1 py-2 px-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.archive}</span>
          </button>

          {moves > 0 && !isWon && (
            <button
              type="button"
              onClick={() => {
                onRestart();
                onClose();
              }}
              title={t.restart}
              className="py-2 px-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-xs font-medium rounded-xl border border-zinc-800 transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.restart}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
