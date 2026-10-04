import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n';

interface ResetConfirmModalProps {
  isOpen: boolean;
  keepsTime: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  keepsTime,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-[#0f0f14] rounded-3xl p-6 border border-zinc-800 shadow-2xl text-center text-zinc-100 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <RotateCcw className="w-6 h-6 text-zinc-400 mx-auto mb-3 stroke-[2]" />
        
        <h3 className="text-base font-semibold text-white mb-1">
          {t.clearConfirm}
        </h3>
        {keepsTime && (
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
            {t.clearKeepsTime}
          </p>
        )}

        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none"
          >
            {t.clearCancel}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm font-medium transition-all active:scale-[0.98] cursor-pointer select-none"
          >
            {t.clearYes}
          </button>
        </div>
      </div>
    </div>
  );
};
