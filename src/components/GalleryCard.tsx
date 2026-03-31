"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toggleFavorite } from "@/lib/api";
import type { Generation } from "@/lib/api";

interface Props {
  generation: Generation;
  onClick: (generation: Generation) => void;
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

export function GalleryCard({ generation: gen, onClick }: Props) {
  const [isFav, setIsFav] = useState(gen.is_favorite);
  const aspectRatio = `${gen.width} / ${gen.height}`;
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
      className="relative group text-left rounded-md overflow-hidden transition-all duration-150 cursor-pointer"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Clickable card area */}
      <button
        data-testid={`gallery-card-${gen.id}`}
        onClick={() => onClick(gen)}
        className="w-full text-left"
        aria-label={`${gen.prompt.slice(0, 50)} の詳細を開く`}
      >
        {/* Image */}
        {gen.image_url ? (
          <div className="relative w-full" style={{ aspectRatio }}>
            <Image
              src={gen.image_url}
              alt={gen.prompt.slice(0, 100)}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{ aspectRatio, backgroundColor: "var(--color-bg-elevated)" }}
          >
            <span style={{ color: "var(--color-text-disabled)" }}>No image</span>
          </div>
        )}

        {/* Card info */}
        <div className="p-3 flex flex-col gap-1">
          {templateLabel && (
            <span
              data-testid="gallery-card-template"
              className="text-xs px-1.5 py-0.5 rounded self-start"
              style={{
                backgroundColor: "var(--color-accent-muted)",
                color: "var(--color-accent)",
              }}
            >
              {templateLabel}
            </span>
          )}
          <p
            data-testid="gallery-card-prompt"
            className="text-xs line-clamp-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {gen.prompt}
          </p>
          <p
            data-testid="gallery-card-date"
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {formatDate(gen.created_at)}
          </p>
        </div>
      </button>

      {/* Favorite button — top right overlay on image */}
      <button
        data-testid={`gallery-card-favorite-${gen.id}`}
        onClick={handleFavoriteToggle}
        aria-label={isFav ? "お気に入りから削除" : "お気に入りに追加"}
        aria-pressed={isFav}
        className="absolute top-2 right-2 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{
          width: "28px",
          height: "28px",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: isFav ? "var(--color-error)" : "var(--color-text-secondary)",
          border: "none",
        }}
      >
        {isFav ? "♥" : "♡"}
      </button>

      {/* Detail page link */}
      <Link
        href={`/gallery/${gen.id}`}
        data-testid={`gallery-card-detail-link-${gen.id}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="詳細ページを開く"
        className="absolute bottom-2 right-2 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{
          width: "24px",
          height: "24px",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "var(--color-text-secondary)",
          fontSize: "12px",
        }}
      >
        ↗
      </Link>
    </div>
  );
}
