"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleFavorite } from "@/lib/api";
import { SimilarDesigns } from "@/components/SimilarDesigns";
import {
  downloadImageWithResolution,
  downloadMetadataFromGeneration,
} from "@/lib/exportUtils";
import type { Generation } from "@/lib/api";

interface Props {
  generation: Generation;
  similar: Generation[];
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

const WORKFLOW_LABELS: Record<string, string> = {
  "flux-gguf": "Flux-schnell",
  "sd15": "SD1.5",
};

const TEMPLATE_LABELS: Record<string, string> = {
  "blog-thumbnail": "ブログサムネイル",
  "sns-post": "SNS投稿画像",
  "icon": "アイコン",
  "illustration": "イラスト",
};

export function GalleryDetailClient({ generation: gen, similar }: Props) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(gen.is_favorite);
  const [resolution, setResolution] = useState<"1x" | "2x">("1x");
  const [downloading, setDownloading] = useState(false);

  const handleFavoriteToggle = async () => {
    const next = !isFav;
    setIsFav(next);
    try {
      await toggleFavorite(gen.id, next);
    } catch {
      setIsFav(!next);
    }
  };

  const handleRegenerate = () => {
    const params = new URLSearchParams({
      prompt: gen.prompt,
      workflow: gen.workflow,
      width: String(gen.width),
      height: String(gen.height),
      steps: String(gen.steps),
      seed: String(gen.seed),
    });
    if (gen.template_id) params.set("templateId", gen.template_id);
    if (gen.negative_prompt) params.set("negativePrompt", gen.negative_prompt);
    router.push(`/?${params.toString()}`);
  };

  const handleDownload = async () => {
    if (!gen.image_url || downloading) return;
    setDownloading(true);
    try {
      await downloadImageWithResolution(gen.image_url, gen.template_id, resolution);
    } finally {
      setDownloading(false);
    }
  };

  const handleMetadataDownload = () => {
    downloadMetadataFromGeneration(gen);
  };

  const aspectRatio = `${gen.width} / ${gen.height}`;

  return (
    <div className="min-h-screen p-6 flex flex-col gap-8" style={{ color: "var(--color-text-primary)" }}>
      {/* Back link */}
      <div>
        <Link
          href="/gallery"
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ← ギャラリーに戻る
        </Link>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image */}
        <div
          className="flex-1 flex items-center justify-center rounded-lg overflow-hidden"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            minHeight: "300px",
          }}
        >
          {gen.image_url ? (
            <div className="relative w-full" style={{ aspectRatio }}>
              <Image
                src={gen.image_url}
                alt={gen.prompt.slice(0, 100)}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <span style={{ color: "var(--color-text-disabled)" }}>No image</span>
          )}
        </div>

        {/* Details */}
        <div
          className="w-full md:w-72 flex flex-col gap-4 p-5 rounded-lg"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-base" style={{ color: "var(--color-text-primary)" }}>
              生成詳細
            </h1>
            <button
              onClick={handleFavoriteToggle}
              aria-label={isFav ? "お気に入りから削除" : "お気に入りに追加"}
              aria-pressed={isFav}
              style={{
                width: "32px",
                height: "32px",
                color: isFav ? "var(--color-error)" : "var(--color-text-secondary)",
                fontSize: "18px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {isFav ? "♥" : "♡"}
            </button>
          </div>

          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>ワークフロー</dt>
              <dd>{WORKFLOW_LABELS[gen.workflow] ?? gen.workflow}</dd>
            </div>
            {gen.template_id && (
              <div>
                <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>テンプレート</dt>
                <dd>{TEMPLATE_LABELS[gen.template_id] ?? gen.template_id}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>サイズ</dt>
              <dd>{gen.width} × {gen.height}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>ステップ</dt>
              <dd>{gen.steps}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>CFGスケール</dt>
              <dd>{gen.cfg_scale}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>シード</dt>
              <dd className="font-mono text-xs">{gen.seed}</dd>
            </div>
            {gen.execution_time !== null && (
              <div>
                <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>生成時間</dt>
                <dd>{gen.execution_time} ms</dd>
              </div>
            )}
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>生成日時</dt>
              <dd className="text-xs">{formatDate(gen.created_at)}</dd>
            </div>
          </dl>

          <div style={{ borderTop: "1px solid var(--color-border)" }} />

          <div className="flex flex-col gap-2">
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>プロンプト</span>
            <div
              className="p-2 rounded text-xs break-words"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              {gen.prompt}
            </div>
            {gen.negative_prompt && (
              <>
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>ネガティブプロンプト</span>
                <div
                  className="p-2 rounded text-xs break-words"
                  style={{
                    backgroundColor: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    maxHeight: "80px",
                    overflowY: "auto",
                  }}
                >
                  {gen.negative_prompt}
                </div>
              </>
            )}
          </div>

          {gen.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {gen.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--color-accent-muted)",
                    color: "var(--color-accent)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={handleRegenerate}
              className="w-full py-2 px-4 rounded text-sm font-medium"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
              }}
            >
              再生成
            </button>
            {/* Resolution selector */}
            <div
              className="flex rounded overflow-hidden"
              style={{ border: "1px solid var(--color-border)" }}
              role="group"
              aria-label="解像度選択"
            >
              {(["1x", "2x"] as const).map((r) => (
                <button
                  key={r}
                  data-testid={`detail-resolution-${r}-btn`}
                  onClick={() => setResolution(r)}
                  aria-pressed={resolution === r}
                  className="flex-1 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: resolution === r ? "var(--color-accent)" : "var(--color-bg-elevated)",
                    color: resolution === r ? "#fff" : "var(--color-text-secondary)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              data-testid="detail-download-btn"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-2 px-4 rounded text-sm"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                cursor: downloading ? "not-allowed" : "pointer",
                opacity: downloading ? 0.6 : 1,
              }}
            >
              {downloading ? "処理中..." : "↓ PNG保存"}
            </button>
            <button
              data-testid="detail-metadata-btn"
              onClick={handleMetadataDownload}
              className="w-full py-2 px-4 rounded text-sm"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              ↓ メタデータ (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* Similar designs */}
      {similar.length > 0 && <SimilarDesigns generations={similar} />}
    </div>
  );
}
