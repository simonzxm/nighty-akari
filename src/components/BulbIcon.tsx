import React from 'react';

interface BulbIconProps {
  isSeed?: boolean;
  className?: string;
}

export const BulbIcon: React.FC<BulbIconProps> = ({ isSeed = false, className = '' }) => {
  if (isSeed) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Outer radial glow */}
        <div className="absolute w-8 h-8 rounded-full bg-amber-400/30 blur-md pointer-events-none" />
        
        {/* Seed Star Icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 text-amber-900 fill-amber-950/80 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] animate-light-pulse"
        >
          {/* 8-pointed star */}
          <path
            d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11" r="2.5" fill="#fef08a" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer soft glow */}
      <div className="absolute w-7 h-7 rounded-full bg-amber-300/40 blur-sm pointer-events-none" />
      
      {/* Crisp glowing bulb */}
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 drop-shadow-[0_0_6px_rgba(253,224,71,0.8)]"
      >
        {/* Bulb dome */}
        <circle
          cx="12"
          cy="10"
          r="6.5"
          fill="#fef08a"
          stroke="#eab308"
          strokeWidth="1.5"
        />
        {/* Filament coil */}
        <path
          d="M10 10c0-1.1.9-2 2-2s2 .9 2 2c0 .8-.5 1.5-1.2 1.8v1.2h-1.6v-1.2c-.7-.3-1.2-1-1.2-1.8z"
          fill="#ca8a04"
        />
        {/* Base cap */}
        <path
          d="M9.5 16.5h5v2a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-2z"
          fill="#78716c"
        />
      </svg>
    </div>
  );
};
