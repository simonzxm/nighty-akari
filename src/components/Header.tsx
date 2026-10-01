import React, { useState } from 'react';
import { Calendar, HelpCircle, RotateCcw, Undo2, Languages } from 'lucide-react';
import { useI18n } from '../i18n';
import { PuzzleDefinition } from '../engine/types';
import { formatGameDate } from '../utils/daily';

interface HeaderProps {
  puzzle: PuzzleDefinition;
  canUndo: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onOpenArchive: () => void;
  onOpenHowToPlay: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  puzzle,
  canUndo,
  onUndo,
  onRestart,
  onOpenArchive,
  onOpenHowToPlay,
}) => {
  const { lang, setLang, t } = useI18n();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'zh' : 'en');
  };

  const handleRestartClick = () => {
    if (showRestartConfirm) {
      onRestart();
      setShowRestartConfirm(false);
    } else {
      setShowRestartConfirm(true);
      setTimeout(() => setShowRestartConfirm(false), 3000);
    }
  };

  return (
    <header className="w-full max-w-2xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between border-b border-zinc-800/80">
      {/* Left controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onOpenArchive}
          title={t.archive}
          aria-label={t.archive}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <Calendar className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onOpenHowToPlay}
          title={t.howToPlay}
          aria-label={t.howToPlay}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          title={t.language}
          aria-label={t.language}
          className="px-2 py-1 text-xs font-mono font-medium text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-1"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? '中' : 'EN'}</span>
        </button>
      </div>

      {/* Center branding & daily date */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-1.5">
          <span className="text-amber-400 text-sm">✦</span>
          <span>{t.appTitle}</span>
        </h1>
        <span className="text-[11px] sm:text-xs text-zinc-400 font-mono tracking-wide mt-0.5">
          {t.dailyNo(puzzle.number)} · {formatGameDate(puzzle.date, lang)}
        </span>
      </div>

      {/* Right controls: Undo & Restart */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title={t.undo}
          aria-label={t.undo}
          className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleRestartClick}
          title={showRestartConfirm ? t.clearConfirm : t.restart}
          aria-label={t.restart}
          className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs sm:text-sm font-medium ${
            showRestartConfirm
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {showRestartConfirm && <span>{t.clearYes}?</span>}
        </button>
      </div>
    </header>
  );
};
