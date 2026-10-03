import React from 'react';
import { BulbIcon } from './BulbIcon';
import { WallData } from '../engine/types';

interface WhiteCellProps {
  r: number;
  c: number;
  cellIndex: number;
  isLit: boolean;
  hasBulb: boolean;
  isSeed: boolean;
  isInPreviewRay: boolean;
  isHovered: boolean;
  canPlace: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface WallCellProps {
  wall: WallData;
  wallIndex: number;
  currentCount: number;
  previewViolated: boolean;
}

export const WhiteCell: React.FC<WhiteCellProps> = ({
  r,
  c,
  isLit,
  hasBulb,
  isSeed,
  isInPreviewRay,
  isHovered,
  canPlace,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  let cursorClass = 'cursor-pointer';
  if (isSeed) {
    cursorClass = 'cursor-not-allowed';
  } else if (!hasBulb && !isLit) {
    cursorClass = 'cursor-not-allowed';
  }

  // Refined Color Palette:
  // - Lamp cell (epicenter): luminous warm sunbeam with amber border
  // - Lit empty cell: glowing golden ivory with amber border
  // - Unlit playable cell: clearly distinct dark slate tile with visible border
  let bgClass = 'bg-[#1e202b] border border-slate-700/50 hover:bg-[#272a39]';

  if (hasBulb) {
    bgClass = 'bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] border border-amber-400/90 shadow-[inset_0_0_16px_rgba(180,83,9,0.35)]';
  } else if (isLit) {
    bgClass = 'bg-[#fef3c7] border border-amber-300/60 shadow-[inset_0_0_8px_rgba(251,191,36,0.18)]';
  }

  // Hover beam preview
  if (isInPreviewRay && !isLit) {
    bgClass = 'bg-[#323648] border border-amber-400/50';
  } else if (isInPreviewRay && isLit && !hasBulb) {
    bgClass = 'bg-[#fde68a] border border-amber-400/70 shadow-[inset_0_0_10px_rgba(245,158,11,0.25)]';
  }

  return (
    <button
      type="button"
      tabIndex={0}
      aria-label={`Row ${r + 1}, Col ${c + 1}, ${
        isSeed
          ? 'Permanent celestial moon'
          : hasBulb
          ? 'Light bulb, click to extinguish'
          : isLit
          ? 'Lit square, click to place light'
          : 'Dark square'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onMouseEnter}
      onBlur={onMouseLeave}
      className={`relative w-full h-full aspect-square rounded-md sm:rounded-lg transition-all duration-150 flex items-center justify-center select-none outline-none ${cursorClass} ${bgClass}`}
    >
      {/* Placed Lamp / Celestial Moon */}
      {hasBulb && (
        <BulbIcon
          isSeed={isSeed}
          className="transition-transform duration-150 transform hover:scale-105 active:scale-95"
        />
      )}

      {/* Ghost Lamp Preview on Hover when playable */}
      {!hasBulb && isLit && isHovered && canPlace && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 transform scale-90 transition-opacity">
          <BulbIcon isSeed={false} />
        </div>
      )}
    </button>
  );
};

export const WallCell: React.FC<WallCellProps> = ({
  wall,
  currentCount,
  previewViolated,
}) => {
  const isNumbered = wall.value !== '#';
  const target = isNumbered ? Number(wall.value) : -1;
  const isSatisfied = isNumbered && currentCount === target;
  const isViolated = isNumbered && currentCount > target;

  // Obsidian wall block styling with inset depth
  let textStyle = 'text-zinc-100 font-bold';
  let bgStyle = 'bg-[#06070a] border border-zinc-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)]';

  if (isSatisfied) {
    // Satisfied condition: warm amber fulfillment with soft aura
    textStyle = 'text-amber-300 font-bold';
    bgStyle = 'bg-[#18150c] border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.22),inset_0_1px_3px_rgba(245,158,11,0.15)]';
  } else if (isViolated || previewViolated) {
    // Error / Violation condition: crisp rose-red warning
    textStyle = 'text-rose-300 font-bold';
    bgStyle = 'bg-rose-950/70 border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
  }

  return (
    <div
      aria-label={`Wall at row ${wall.r + 1}, col ${wall.c + 1}${
        isNumbered ? `, target ${target}, current ${currentCount}` : ', solid obstacle'
      }`}
      className={`relative w-full h-full aspect-square rounded-md sm:rounded-lg select-none flex items-center justify-center font-mono transition-colors duration-150 ${bgStyle} ${textStyle}`}
    >
      {isNumbered ? (
        <span
          style={{ fontSize: 'clamp(1.125rem, calc(var(--cell-size) * 0.42), 1.625rem)' }}
          className="select-none leading-none tracking-tight"
        >
          {wall.value}
        </span>
      ) : (
        /* Unnumbered Wall Pillar Marker to distinguish immediately from empty floor */
        <svg
          viewBox="0 0 16 16"
          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-700/70 fill-current select-none pointer-events-none"
          aria-hidden="true"
        >
          <rect x="7" y="3" width="2" height="10" rx="1" />
          <rect x="3" y="7" width="10" height="2" rx="1" />
        </svg>
      )}
    </div>
  );
};
