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

  // Pure colors without borders
  let bgClass = 'bg-[#18181c]';
  if (isLit) {
    bgClass = 'bg-[#fef08a]';
  }

  // Subtle preview illumination without harsh border rings
  if (isInPreviewRay && !isLit) {
    bgClass = 'bg-[#27272e]';
  } else if (isInPreviewRay && isLit) {
    bgClass = 'bg-[#fff59d]';
  }

  return (
    <button
      type="button"
      tabIndex={0}
      aria-label={`Row ${r + 1}, Col ${c + 1}, ${
        isSeed
          ? 'Seed light'
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
      className={`relative aspect-square transition-colors duration-100 flex items-center justify-center select-none outline-none ${cursorClass} ${bgClass}`}
    >
      {/* Light Bulb */}
      {hasBulb && (
        <BulbIcon
          isSeed={isSeed}
          className="transition-transform duration-100 transform hover:scale-105 active:scale-95"
        />
      )}

      {/* Subtle indicator when empty lit cell is hovered */}
      {!hasBulb && isLit && isHovered && canPlace && (
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 pointer-events-none" />
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

  let textStyle = 'text-white';
  let bgStyle = 'bg-black';

  if (isSatisfied) {
    textStyle = 'text-zinc-500';
  } else if (isViolated || previewViolated) {
    textStyle = 'text-rose-400';
    bgStyle = 'bg-rose-950/40';
  }

  return (
    <div
      aria-label={`Wall at row ${wall.r + 1}, col ${wall.c + 1}${
        isNumbered ? `, target ${target}, current ${currentCount}` : ''
      }`}
      className={`relative aspect-square select-none flex items-center justify-center font-mono font-bold transition-colors duration-100 ${bgStyle} ${textStyle}`}
    >
      {isNumbered ? (
        <span className="select-none text-xl sm:text-2xl leading-none">
          {wall.value}
        </span>
      ) : null}
    </div>
  );
};
