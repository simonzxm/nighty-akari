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
  isAffectedByPreview: boolean;
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
  // Cursor logic:
  // - seed: not-allowed (cannot extinguish)
  // - has non-seed bulb: pointer (click to extinguish)
  // - unlit: not-allowed (cannot place without light)
  // - lit and empty: pointer (click to place)
  let cursorClass = 'cursor-pointer';
  if (isSeed) {
    cursorClass = 'cursor-not-allowed';
  } else if (!hasBulb && !isLit) {
    cursorClass = 'cursor-not-allowed';
  }

  // Visual background:
  // When lit: glowing bright warm light (#fef08a)
  // When unlit: deep dark tile (#18181b)
  let bgClass = 'bg-[#18181b] border-[#27272a]';
  if (isLit) {
    bgClass = 'bg-[#fff59d] text-zinc-900 border-[#fde047]/60 shadow-[0_0_12px_rgba(253,224,71,0.15)]';
  }

  // Hover or preview ray overlay
  let overlayClass = '';
  if (isInPreviewRay && !isLit) {
    overlayClass = 'bg-amber-400/25 ring-1 ring-inset ring-amber-400/50';
  } else if (isInPreviewRay && isLit) {
    overlayClass = 'bg-amber-200/40 ring-1 ring-inset ring-amber-400/70';
  }

  if (isHovered && canPlace) {
    overlayClass += ' ring-2 ring-inset ring-amber-400';
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
      className={`relative aspect-square border transition-colors duration-150 flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:z-10 ${cursorClass} ${bgClass} ${overlayClass}`}
    >
      {/* Light Bulb Rendering */}
      {hasBulb && (
        <BulbIcon
          isSeed={isSeed}
          className="transition-transform duration-150 transform hover:scale-110 active:scale-95"
        />
      )}

      {/* Subtle indicator when empty cell is hovered and ready to place */}
      {!hasBulb && isLit && isHovered && (
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50 animate-pulse pointer-events-none" />
      )}
    </button>
  );
};

export const WallCell: React.FC<WallCellProps> = ({
  wall,
  currentCount,
  isAffectedByPreview,
  previewViolated,
}) => {
  const isNumbered = wall.value !== '#';
  const target = isNumbered ? Number(wall.value) : -1;
  const isSatisfied = isNumbered && currentCount === target;
  const isViolated = isNumbered && currentCount > target;

  let borderStyle = 'border-[#27272a]';
  let textStyle = 'text-zinc-400';
  let bgStyle = 'bg-[#09090b]';

  if (isSatisfied) {
    textStyle = 'text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]';
    borderStyle = 'border-amber-500/40';
  } else if (isViolated || previewViolated) {
    textStyle = 'text-rose-400 font-bold';
    borderStyle = 'border-rose-500 ring-1 ring-rose-500';
    bgStyle = 'bg-rose-950/30';
  } else if (isAffectedByPreview) {
    borderStyle = 'border-amber-400/70 ring-1 ring-amber-400/50';
  }

  return (
    <div
      aria-label={`Wall at row ${wall.r + 1}, col ${wall.c + 1}${
        isNumbered ? `, target ${target}, current ${currentCount}` : ''
      }`}
      className={`relative aspect-square border select-none flex items-center justify-center text-xl font-semibold tracking-wider transition-all duration-150 ${bgStyle} ${borderStyle} ${textStyle}`}
    >
      {isNumbered ? (
        <span className="select-none text-2xl font-mono leading-none">
          {wall.value}
        </span>
      ) : null}
    </div>
  );
};
