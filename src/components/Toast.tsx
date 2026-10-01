import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClear: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClear, duration = 2200 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClear();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClear]);

  if (!message) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-fadeIn">
      <div className="px-4 py-2 bg-zinc-900/90 text-zinc-200 text-xs sm:text-sm font-medium rounded-full border border-zinc-700 shadow-xl backdrop-blur-md flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        {message}
      </div>
    </div>
  );
};
