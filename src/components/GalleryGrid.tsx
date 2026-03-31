"use client";

import { GalleryCard } from "@/components/GalleryCard";
import type { Generation } from "@/lib/api";

const GRID_SIZE_MAP = {
  sm: "minmax(120px, 1fr)",
  md: "minmax(200px, 1fr)",
  lg: "minmax(300px, 1fr)",
} as const;

interface Props {
  generations: Generation[];
  onCardClick: (generation: Generation) => void;
  gridSize?: "sm" | "md" | "lg";
}

export function GalleryGrid({ generations, onCardClick, gridSize = "md" }: Props) {
  if (generations.length === 0) {
    return (
      <div
        data-testid="gallery-empty"
        className="flex flex-col items-center justify-center py-20 gap-3"
      >
        <span className="text-4xl">🖼️</span>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          まだ生成画像がありません
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="gallery-grid"
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fill, ${GRID_SIZE_MAP[gridSize]})`,
      }}
    >
      {generations.map((gen) => (
        <GalleryCard key={gen.id} generation={gen} onClick={onCardClick} />
      ))}
    </div>
  );
}
