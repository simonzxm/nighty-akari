import React from 'react';
import { Moon } from 'lucide-react';

interface BulbIconProps {
  isSeed?: boolean;
  className?: string;
}

export const BulbIcon: React.FC<BulbIconProps> = ({ isSeed = false, className = '' }) => {
  if (isSeed) {
    return (
      <div className={`relative flex items-center justify-center w-full h-full select-none pointer-events-none ${className}`}>
        {/* Soft celestial moon halo */}
        <div className="absolute w-[88%] h-[88%] rounded-full bg-white/35 blur-md pointer-events-none" />

        {/* Crisp, brilliant pure-white crescent moon */}
        <Moon
          className="relative w-[70%] h-[70%] max-w-[44px] max-h-[44px] text-white fill-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] animate-pop"
          strokeWidth={1}
        />
      </div>
    );
  }

  // Regular lamp: Modern, pure-white luminous bulb
  return (
    <div className={`relative flex items-center justify-center w-full h-full select-none pointer-events-none ${className}`}>
      {/* Soft warm luminous aura */}
      <div className="absolute w-[85%] h-[85%] rounded-full bg-white/35 blur-md pointer-events-none" />

      {/* Crafted lightbulb icon with glass dome, filament, and base */}
      <svg
        viewBox="0 0 24 24"
        className="relative w-[72%] h-[72%] max-w-[46px] max-h-[46px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] animate-pop"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Luminous pure-white bulb body */}
        <path
          d="M12 2 C7.86 2 4.5 5.36 4.5 9.5 C4.5 12.22 5.95 14.6 8.15 15.87 C8.68 16.18 9 16.74 9 17.35 V19 C9 19.55 9.45 20 10 20 H14 C14.55 20 15 19.55 15 19 V17.35 C15 16.74 15.32 16.18 15.85 15.87 C18.05 14.6 19.5 12.22 19.5 9.5 C19.5 5.36 16.14 2 12 2 Z"
          fill="#ffffff"
        />

        {/* Base rounded contact point */}
        <path
          d="M10.25 20.25 C10.25 21.2 10.9 21.8 12 21.8 C13.1 21.8 13.75 21.2 13.75 20.25 H10.25 Z"
          fill="#d4d4d8"
        />

        {/* Delicate base thread rings */}
        <line x1="9" y1="17.25" x2="15" y2="17.25" stroke="#d4d4d8" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="9.5" y1="18.75" x2="14.5" y2="18.75" stroke="#d4d4d8" strokeWidth="0.8" strokeLinecap="round" />

        {/* Warm incandescent filament */}
        <path
          d="M10 11.5 C10 9.2 11 8.2 12 8.2 C13 8.2 14 9.2 14 11.5"
          stroke="#f59e0b"
          strokeWidth="1.25"
          strokeLinecap="round"
        />

        {/* Subtle glass reflection sheen on upper dome */}
        <path
          d="M7.8 7.2 C8.4 5.2 10 3.8 12 3.5"
          stroke="#ffffff"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
};
