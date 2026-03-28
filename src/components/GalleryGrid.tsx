"use client";

import Image from "next/image";
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

export function GalleryGrid({ generations, onCardClick }: Props) {
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
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      }}
    >
      {generations.map((gen) => {
        const aspectRatio = `${gen.width} / ${gen.height}`;
        const templateLabel = gen.template_id ? TEMPLATE_LABELS[gen.template_id] : null;

        return (
          <button
            key={gen.id}
            data-testid={`gallery-card-${gen.id}`}
            onClick={() => onCardClick(gen)}
            className="text-left rounded-md overflow-hidden transition-all duration-150"
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
        );
      })}
    </div>
  );
}
