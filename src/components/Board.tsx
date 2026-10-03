import React, { useEffect, useState } from 'react';
import { BoardModel, BoardInspection } from '../engine/types';
import { WhiteCell, WallCell } from './CellView';

interface BoardProps {
  model: BoardModel;
  state: bigint;
  inspection: BoardInspection;
  onToggleCell: (cellIndex: number) => void;
  isWon: boolean;
}

export const Board: React.FC<BoardProps> = ({
  model,
  state,
  inspection,
  onToggleCell,
  isWon,
}) => {
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);

  const [supportsHover, setSupportsHover] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = (e: MediaQueryListEvent) => {
      setSupportsHover(e.matches);
      if (!e.matches) {
        setHoveredCellIndex(null);
      }
    };
    mql.addEventListener?.('change', onChange);
    return () => {
      mql.removeEventListener?.('change', onChange);
    };
  }, []);

  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerHeight >= window.innerWidth;
  });

  useEffect(() => {
    const update = () => {
      setIsPortrait(window.innerHeight >= window.innerWidth);
    };
    window.addEventListener('resize', update);
    const mql = window.matchMedia('(orientation: portrait)');
    mql.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      mql.removeEventListener?.('change', update);
    };
  }, []);

  const isNonSquare = model.w !== model.h;
  // In portrait (height >= width), tall boards fit best: rotate if board is wide (w > h).
  // In landscape (width > height), wide boards fit best: rotate if board is tall (h > w).
  const shouldRotate =
    isNonSquare && ((isPortrait && model.w > model.h) || (!isPortrait && model.h > model.w));

  const visW = shouldRotate ? model.h : model.w;
  const visH = shouldRotate ? model.w : model.h;

  // Compute preview details when a cell is hovered on devices with hover/fine pointer
  let previewLitMask = 0n;
  const previewViolatedWalls = new Set<number>();
  const previewAffectedWalls = new Set<number>();

  if (supportsHover && hoveredCellIndex !== null && !isWon) {
    const ray = model.rays[hoveredCellIndex];
    if (ray) {
      previewLitMask = ray.litMask;
      const isBulb = (state & (1n << BigInt(hoveredCellIndex))) !== 0n;

      for (const wIdx of ray.hits) {
        previewAffectedWalls.add(wIdx);
        const wall = model.walls[wIdx];
        if (wall.value !== '#') {
          const target = Number(wall.value);
          if (!isBulb && inspection.counts[wIdx] + 1 > target) {
            previewViolatedWalls.add(wIdx);
          }
        }
      }
    }
  }

  const handleMouseEnter = (cellIdx: number) => {
    if (supportsHover) {
      setHoveredCellIndex(cellIdx);
    }
  };

  const handleMouseLeave = () => {
    if (supportsHover) {
      setHoveredCellIndex(null);
    }
  };

  const handleToggle = (cellIdx: number) => {
    if (!supportsHover) {
      setHoveredCellIndex(null);
    }
    onToggleCell(cellIdx);
  };

  const wGaps = Math.max(0, visW - 1);
  const hGaps = Math.max(0, visH - 1);
  const cellW = `calc((var(--max-board-w) - 2 * var(--board-pad) - ${wGaps} * var(--board-gap)) / ${visW})`;
  const cellH = `calc((var(--max-board-h) - 2 * var(--board-pad) - ${hGaps} * var(--board-gap)) / ${visH})`;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`grid akari-board bg-[#0e0f16] rounded-2xl border border-zinc-800/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-500 ${
          isWon ? 'animate-victory-glow ring-1 ring-amber-400/40' : ''
        }`}
        style={{
          ['--cell-size' as string]: `min(${cellW}, ${cellH}, 76px)`,
          gridTemplateColumns: `repeat(${visW}, var(--cell-size))`,
          gridTemplateRows: `repeat(${visH}, var(--cell-size))`,
          gap: 'var(--board-gap)',
          padding: 'var(--board-pad)',
          width: 'fit-content',
          height: 'fit-content',
        }}
      >
        {Array.from({ length: visH }).map((_, vr) =>
          Array.from({ length: visW }).map((_, vc) => {
            const r = shouldRotate ? model.h - 1 - vc : vr;
            const c = shouldRotate ? vr : vc;
            const key = `${r},${c}`;
            const cellIdx = model.ix.get(key);
            const wallIdx = model.wi.get(key);

            if (cellIdx !== undefined) {
              const bit = 1n << BigInt(cellIdx);
              const hasBulb = (state & bit) !== 0n;
              const isLit = (inspection.litMask & bit) !== 0n;
              const isSeed = cellIdx === model.seedIndex;
              const isInPreview = supportsHover && (previewLitMask & bit) !== 0n;
              const isHovered = supportsHover && hoveredCellIndex === cellIdx;

              return (
                <WhiteCell
                  key={key}
                  r={vr}
                  c={vc}
                  cellIndex={cellIdx}
                  isLit={isLit}
                  hasBulb={hasBulb}
                  isSeed={isSeed}
                  isInPreviewRay={isInPreview}
                  isHovered={isHovered}
                  canPlace={isLit && !hasBulb}
                  onClick={() => handleToggle(cellIdx)}
                  onMouseEnter={() => handleMouseEnter(cellIdx)}
                  onMouseLeave={handleMouseLeave}
                />
              );
            }

            if (wallIdx !== undefined) {
              const wall = model.walls[wallIdx];
              return (
                <WallCell
                  key={key}
                  wall={wall}
                  wallIndex={wallIdx}
                  currentCount={inspection.counts[wallIdx] || 0}
                  previewViolated={previewViolatedWalls.has(wallIdx)}
                  r={vr}
                  c={vc}
                />
              );
            }

            return <div key={key} className="bg-black" />;
          })
        )}
      </div>
    </div>
  );
};
