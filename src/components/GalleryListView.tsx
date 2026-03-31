"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toggleFavorite } from "@/lib/api";
import type { Generation } from "@/lib/api";

interface Props {
  generations: Generation[];
  onCardClick: (generation: Generation) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TEMPLATE_LABELS: Record<string, string> = {
  "blog-thumbnail": "ブログサムネイル",
  "sns-post": "SNS投稿画像",
  "icon": "アイコン",
  "illustration": "イラスト",
};

const WORKFLOW_LABELS: Record<string, string> = {
  "flux-gguf": "Flux-schnell",
  "sd15": "SD1.5",
};

function ListItem({ gen, onCardClick }: { gen: Generation; onCardClick: (g: Generation) => void }) {
  const [isFav, setIsFav] = useState(gen.is_favorite);
  const templateLabel = gen.template_id ? TEMPLATE_LABELS[gen.template_id] : null;

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isFav;
    setIsFav(next);
    try {
      await toggleFavorite(gen.id, next);
    } catch {
      setIsFav(!next);
    }
  };

  return (
    <div
      data-testid={`gallery-list-item-${gen.id}`}
      className="flex items-center gap-3 transition-colors"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "8px 12px",
      }}
    >
      {/* Thumbnail */}
      <button
        onClick={() => onCardClick(gen)}
        className="flex-shrink-0"
        aria-label={`${gen.prompt.slice(0, 50)} の詳細を開く`}
      >
        {gen.image_url ? (
          <div className="relative" style={{ width: "80px", height: "60px" }}>
            <Image
              src={gen.image_url}
              alt={gen.prompt.slice(0, 100)}
              fill
              className="object-cover"
              style={{ borderRadius: "var(--radius-sm)" }}
              unoptimized
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: "80px",
              height: "60px",
              backgroundColor: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span style={{ color: "var(--color-text-disabled)", fontSize: "10px" }}>No image</span>
          </div>
        )}
      </button>

      {/* Info */}
      <button
        className="flex-1 text-left min-w-0"
        onClick={() => onCardClick(gen)}
        aria-label={`${gen.prompt.slice(0, 50)} の詳細を開く`}
      >
        <div className="flex items-center gap-2 mb-1">
          {templateLabel && (
            <span
              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                backgroundColor: "var(--color-accent-muted)",
                color: "var(--color-accent)",
              }}
            >
              {templateLabel}
            </span>
          )}
        </div>
        <p
          className="text-xs line-clamp-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          {gen.prompt}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {formatDate(gen.created_at)}
        </p>
      </button>

      {/* Favorite button */}
      <button
        data-testid={`gallery-card-favorite-${gen.id}`}
        onClick={handleFavoriteToggle}
        aria-label={isFav ? "お気に入りから削除" : "お気に入りに追加"}
        aria-pressed={isFav}
        className="flex-shrink-0"
        style={{
          color: isFav ? "var(--color-error)" : "var(--color-text-secondary)",
          fontSize: "18px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        {isFav ? "♥" : "♡"}
      </button>

      {/* Workflow label */}
      <span
        className="flex-shrink-0 text-xs"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {WORKFLOW_LABELS[gen.workflow] ?? gen.workflow}
      </span>

      {/* Detail link */}
      <Link
        href={`/gallery/${gen.id}`}
        data-testid={`gallery-card-detail-link-${gen.id}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="詳細ページを開く"
        className="flex-shrink-0 text-xs"
        style={{ color: "var(--color-text-secondary)" }}
      >
        ↗
      </Link>
    </div>
  );
}

export function GalleryListView({ generations, onCardClick }: Props) {
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
      data-testid="gallery-list"
      className="flex flex-col gap-2"
    >
      {generations.map((gen) => (
        <ListItem key={gen.id} gen={gen} onCardClick={onCardClick} />
      ))}
    </div>
  );
}
