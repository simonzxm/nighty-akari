import React from 'react';
import { X, Sun, CornerDownRight, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import { useI18n } from '../i18n';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  const rules = [
    {
      icon: <Sun className="w-4 h-4 text-amber-300 shrink-0" />,
      title: t.rule1Title,
      desc: t.rule1Desc,
    },
    {
      icon: <CornerDownRight className="w-4 h-4 text-amber-300 shrink-0" />,
      title: t.rule2Title,
      desc: t.rule2Desc,
    },
    {
      icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />,
      title: t.rule3Title,
      desc: t.rule3Desc,
    },
    {
      icon: <Flame className="w-4 h-4 text-orange-400 shrink-0" />,
      title: t.rule4Title,
      desc: t.rule4Desc,
    },
    {
      icon: <Sparkles className="w-4 h-4 text-white shrink-0" />,
      title: t.rule5Title,
      desc: t.rule5Desc,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg max-h-[90vh] bg-[#0c0c0f] border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl text-zinc-200 relative flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-amber-400 text-sm">✦</span>
              {t.rulesTitle}
            </h2>
            <p className="text-xs text-amber-300/90 font-medium mt-1">
              {t.rulesGoal}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Rules List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 mt-1 text-xs sm:text-sm leading-relaxed">
          {rules.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
            >
              <div className="flex items-center gap-2 font-semibold text-white mb-1">
                {item.icon}
                <span>{item.title}</span>
              </div>
              <p className="text-zinc-400 pl-6 text-xs sm:text-[13px] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
