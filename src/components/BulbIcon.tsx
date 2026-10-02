import React from 'react';

interface BulbIconProps {
  isSeed?: boolean;
  className?: string;
}

export const BulbIcon: React.FC<BulbIconProps> = ({ isSeed = false, className = '' }) => {
  if (isSeed) {
    return (
      <div className={`relative flex items-center justify-center w-full h-full p-2 select-none pointer-events-none ${className}`}>
        {/* Soft pure white subtle radial halo */}
        <div className="absolute w-[80%] h-[80%] rounded-full bg-white/20 blur-md pointer-events-none" />

        {/* Large Pure White 4-Point Radiant Seed Star */}
        <svg
          viewBox="0 0 24 24"
          className="w-[74%] h-[74%] max-w-[42px] max-h-[42px] drop-shadow-[0_2px_5px_rgba(0,0,0,0.55)] transition-transform duration-150 transform hover:scale-105"
        >
          <path
            d="M12 2 C12 7.8 7.8 12 2 12 C7.8 12 12 16.2 12 22 C12 16.2 16.2 12 22 12 C16.2 12 12 7.8 12 2 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center w-full h-full p-2 select-none pointer-events-none ${className}`}>
      {/* Soft pure white subtle ambient halo */}
      <div className="absolute w-[70%] h-[70%] rounded-full bg-white/25 blur-sm pointer-events-none" />

      {/* Large Pure White Minimalist Solid Circle */}
      <svg
        viewBox="0 0 24 24"
        className="w-[66%] h-[66%] max-w-[38px] max-h-[38px] drop-shadow-[0_2px_5px_rgba(0,0,0,0.55)] transition-transform duration-150 transform hover:scale-105"
      >
        <circle cx="12" cy="12" r="8" fill="#ffffff" />
      </svg>
    </div>
  );
};
