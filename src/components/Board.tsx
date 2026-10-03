import React, { useState } from 'react';
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

  // Compute preview details when a cell is hovered
  let previewLitMask = 0n;
  const previewViolatedWalls = new Set<number>();
  const previewAffectedWalls = new Set<number>();

  if (hoveredCellIndex !== null && !isWon) {
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

  const wGaps = Math.max(0, model.w - 1);
  const hGaps = Math.max(0, model.h - 1);
  const cellW = `calc((var(--max-board-w) - 2 * var(--board-pad) - ${wGaps} * var(--board-gap)) / ${model.w})`;
  const cellH = `calc((var(--max-board-h) - 2 * var(--board-pad) - ${hGaps} * var(--board-gap)) / ${model.h})`;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`grid akari-board bg-[#0e0f16] rounded-2xl border border-zinc-800/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-500 ${
          isWon ? 'animate-victory-glow ring-1 ring-amber-400/40' : ''
        }`}
        style={{
          ['--cell-size' as string]: `min(${cellW}, ${cellH}, 76px)`,
          gridTemplateColumns: `repeat(${model.w}, var(--cell-size))`,
          gridTemplateRows: `repeat(${model.h}, var(--cell-size))`,
          gap: 'var(--board-gap)',
          padding: 'var(--board-pad)',
          width: 'fit-content',
          height: 'fit-content',
        }}
      >
        {Array.from({ length: model.h }).map((_, r) =>
          Array.from({ length: model.w }).map((_, c) => {
            const key = `${r},${c}`;
            const cellIdx = model.ix.get(key);
            const wallIdx = model.wi.get(key);

            if (cellIdx !== undefined) {
              const bit = 1n << BigInt(cellIdx);
              const hasBulb = (state & bit) !== 0n;
              const isLit = (inspection.litMask & bit) !== 0n;
              const isSeed = cellIdx === model.seedIndex;
              const isInPreview = (previewLitMask & bit) !== 0n;
              const isHovered = hoveredCellIndex === cellIdx;

              return (
                <WhiteCell
                  key={key}
                  r={r}
                  c={c}
                  cellIndex={cellIdx}
                  isLit={isLit}
                  hasBulb={hasBulb}
                  isSeed={isSeed}
                  isInPreviewRay={isInPreview}
                  isHovered={isHovered}
                  canPlace={isLit && !hasBulb}
                  onClick={() => onToggleCell(cellIdx)}
                  onMouseEnter={() => setHoveredCellIndex(cellIdx)}
                  onMouseLeave={() => setHoveredCellIndex(null)}
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
