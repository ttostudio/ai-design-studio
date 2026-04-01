"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toggleFavorite } from "@/lib/api";
import {
  downloadImageWithResolution,
  downloadMetadataFromGeneration,
} from "@/lib/exportUtils";
import type { Generation } from "@/lib/api";

interface Props {
  generation: Generation;
  onClose: () => void;
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

export function ImageDetailModal({ generation: gen, onClose }: Props) {
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

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleReusePrompt = () => {
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

  return (
    <div
      data-testid="image-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        data-testid="image-detail-modal"
        className="relative flex w-full max-w-4xl rounded-lg overflow-hidden flex-col md:flex-row"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="生成詳細"
      >
        {/* Close button */}
        <button
          data-testid="modal-close-btn"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          ✕
        </button>

        {/* Image */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            backgroundColor: "var(--color-bg-primary)",
            minHeight: "200px",
            maxHeight: "60vh",
            position: "relative",
          }}
        >
          {gen.image_url ? (
            <div
              className="relative w-full h-full"
              style={{ minHeight: "200px" }}
            >
              <Image
                data-testid="modal-image"
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
          data-testid="modal-details"
          className="w-full md:w-72 flex flex-col gap-4 p-5 overflow-y-auto"
          style={{ borderLeft: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between pr-8">
            <h2
              className="font-semibold text-base"
              style={{ color: "var(--color-text-primary)" }}
            >
              生成詳細
            </h2>
            <button
              data-testid="modal-favorite-btn"
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
            {gen.template_id && (
              <div>
                <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>テンプレート</dt>
                <dd style={{ color: "var(--color-text-primary)" }}>
                  {TEMPLATE_LABELS[gen.template_id] ?? gen.template_id}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>ワークフロー</dt>
              <dd style={{ color: "var(--color-text-primary)" }}>
                {WORKFLOW_LABELS[gen.workflow] ?? gen.workflow}
              </dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>サイズ</dt>
              <dd style={{ color: "var(--color-text-primary)" }}>{gen.width} × {gen.height}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>ステップ</dt>
              <dd style={{ color: "var(--color-text-primary)" }}>{gen.steps}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--color-text-secondary)" }}>シード</dt>
              <dd className="font-mono text-xs" style={{ color: "var(--color-text-primary)" }}>{gen.seed}</dd>
            </div>
          </dl>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--color-border)" }} />

          {/* Prompt */}
          <div className="flex flex-col gap-2">
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>プロンプト</span>
            <div
              data-testid="modal-prompt"
              className="p-2 rounded text-xs break-words"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              {gen.prompt}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              data-testid="modal-reuse-btn"
              onClick={handleReusePrompt}
              className="w-full py-2 px-4 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                borderRadius: "var(--radius-sm)",
              }}
            >
              プロンプトを再利用
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
                  data-testid={`modal-resolution-${r}-btn`}
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
              data-testid="modal-download-btn"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-2 px-4 rounded text-sm transition-colors"
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
              data-testid="modal-metadata-btn"
              onClick={handleMetadataDownload}
              className="w-full py-2 px-4 rounded text-sm transition-colors"
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
            <span
              className="text-center text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              生成日時: {formatDate(gen.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
