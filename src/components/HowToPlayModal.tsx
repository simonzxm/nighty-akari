import React from 'react';
import { X, Sun, CornerDownRight, ShieldAlert, Moon, Flame } from 'lucide-react';
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
      icon: <Moon className="w-4 h-4 text-amber-200 shrink-0 fill-amber-200/20" />,
      title: t.rule5Title,
      desc: t.rule5Desc,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md max-h-[85vh] bg-[#0f0f14] rounded-3xl p-5 sm:p-6 border border-zinc-800 shadow-2xl text-zinc-200 relative flex flex-col">
        {/* Header without border line */}
        <div className="flex items-start justify-between pb-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-300 fill-amber-300/20 shrink-0" strokeWidth={1.75} />
              <span>{t.rulesTitle}</span>
            </h2>
            <p className="text-xs text-zinc-300 mt-1">
              {t.rulesGoal}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Rules List without heavy borders */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1 mt-2 text-xs sm:text-sm">
          {rules.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-2 font-medium text-white mb-1">
                {item.icon}
                <span>{item.title}</span>
              </div>
              <p className="text-zinc-300 pl-6 text-xs sm:text-[13px] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
