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
          // If placing, count would increase by 1
          if (!isBulb && inspection.counts[wIdx] + 1 > target) {
            previewViolatedWalls.add(wIdx);
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-6">
      <div
        className="grid gap-[2px] w-full max-w-[420px] aspect-square bg-[#18181b] p-[2px] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl shadow-black/80 transition-all duration-300"
        style={{
          gridTemplateColumns: `repeat(${model.w}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${model.h}, minmax(0, 1fr))`,
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
                  isAffectedByPreview={previewAffectedWalls.has(wallIdx)}
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
