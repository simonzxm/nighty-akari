import React from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0d0d10] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-200 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold tracking-tight text-zinc-100 mb-2">
          {t.rulesTitle}
        </h2>
        <p className="text-sm text-amber-400/90 font-medium mb-5">
          {t.rulesGoal}
        </p>

        <div className="space-y-3.5 text-sm text-zinc-300 leading-relaxed">
          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
            {t.rule1}
          </div>
          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
            {t.rule2}
          </div>
          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
            {t.rule3}
          </div>
          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
            {t.rule4}
          </div>
          <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80">
            {t.rule5}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-medium rounded-xl transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
