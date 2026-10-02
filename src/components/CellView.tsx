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
  // - Lamp cell (epicenter): luminous warm sunbeam
  // - Lit empty cell: soft glowing golden ivory
  // - Unlit cell: calm dark slate tile
  let bgClass = 'bg-[#181920]';

  if (hasBulb) {
    bgClass = 'bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] shadow-[inset_0_0_16px_rgba(180,83,9,0.35)]';
  } else if (isLit) {
    bgClass = 'bg-[#fef3c7] shadow-[inset_0_0_8px_rgba(251,191,36,0.12)]';
  }

  // Hover beam preview
  if (isInPreviewRay && !isLit) {
    bgClass = 'bg-[#2a2c38]';
  } else if (isInPreviewRay && isLit && !hasBulb) {
    bgClass = 'bg-[#fef9c3]';
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
      className={`relative aspect-square rounded-md sm:rounded-lg transition-all duration-150 flex items-center justify-center select-none outline-none ${cursorClass} ${bgClass}`}
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

  let textStyle = 'text-zinc-400 font-medium';
  let bgStyle = 'bg-[#090a0e]';

  if (isSatisfied) {
    // Satisfied condition: warm amber fulfillment
    textStyle = 'text-amber-300 font-bold';
    bgStyle = 'bg-[#15140d]';
  } else if (isViolated || previewViolated) {
    // Error / Violation condition: crisp rose-red
    textStyle = 'text-rose-400 font-bold';
    bgStyle = 'bg-rose-950/50';
  }

  return (
    <div
      aria-label={`Wall at row ${wall.r + 1}, col ${wall.c + 1}${
        isNumbered ? `, target ${target}, current ${currentCount}` : ''
      }`}
      className={`relative aspect-square rounded-md sm:rounded-lg select-none flex items-center justify-center font-mono transition-colors duration-150 ${bgStyle} ${textStyle}`}
    >
      {isNumbered ? (
        <span className="select-none text-xl sm:text-2xl leading-none tracking-tight">
          {wall.value}
        </span>
      ) : null}
    </div>
  );
};
