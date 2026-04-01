"use client";

import Image from "next/image";
import { useState } from "react";
import { ProgressBar } from "./ProgressBar";
import {
  downloadImageWithResolution,
  downloadMetadataFromPreview,
  type PreviewMetadata,
} from "@/lib/exportUtils";
import type { GenerationStatus } from "@/hooks/useGeneration";

interface Props {
  status: GenerationStatus;
  progress: number;
  imageUrl: string | null;
  errorMessage: string | null;
  width: number;
  height: number;
  prompt: string;
  generationId: string | null;
  generationParams?: Omit<PreviewMetadata, "generationId" | "prompt" | "width" | "height"> | null;
  onRetry: () => void;
}

export function PreviewPanel({
  status,
  progress,
  imageUrl,
  errorMessage,
  width,
  height,
  prompt,
  generationId,
  generationParams,
  onRetry,
}: Props) {
  const aspectRatio = `${width} / ${height}`;
  const [resolution, setResolution] = useState<"1x" | "2x">("1x");
  const [downloading, setDownloading] = useState(false);

  const templateId = generationParams?.templateId;

  const handleDownload = async () => {
    if (!imageUrl || downloading) return;
    setDownloading(true);
    try {
      await downloadImageWithResolution(imageUrl, templateId, resolution);
    } finally {
      setDownloading(false);
    }
  };

  const handleMetadataDownload = () => {
    if (!generationId || !generationParams) return;
    downloadMetadataFromPreview({
      generationId,
      prompt,
      width,
      height,
      ...generationParams,
    });
  };

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
  };

  return (
    <div
      data-testid="preview-panel"
      className="flex flex-col h-full"
      style={{ minHeight: "300px" }}
    >
      <div
        className="relative flex-1 flex items-center justify-center rounded-md overflow-hidden"
        style={{
          aspectRatio,
          backgroundColor: "var(--color-bg-elevated)",
          border: `1px dashed var(--color-border)`,
          borderStyle: status === "idle" ? "dashed" : "solid",
          borderRadius: "var(--radius-md)",
          minHeight: "200px",
        }}
      >
        {/* idle */}
        {status === "idle" && (
          <div
            data-testid="preview-idle"
            className="flex flex-col items-center gap-3 text-center px-8"
          >
            <span className="text-4xl">🎨</span>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              プロンプトを入力して
              <br />
              画像を生成してください
            </p>
          </div>
        )}

        {/* queued / processing */}
        {(status === "queued" || status === "processing") && (
          <div
            data-testid="preview-processing"
            className="flex flex-col items-center gap-4 w-full px-8 animate-pulse-glow"
            aria-live="polite"
            aria-label={`生成中 ${progress}%`}
          >
            <ProgressBar progress={progress} />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {status === "queued" ? "キューに追加中..." : `生成中... ${progress}%`}
            </p>
          </div>
        )}

        {/* complete */}
        {status === "complete" && imageUrl && (
          <>
            <Image
              data-testid="preview-image"
              src={imageUrl}
              alt={prompt.slice(0, 100)}
              fill
              className="object-contain"
              unoptimized
            />
            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                data-testid="preview-copy-prompt-btn"
                onClick={handleCopyPrompt}
                aria-label="プロンプトをコピー"
                title="プロンプトをコピー"
                className="p-2 rounded text-sm transition-colors"
                style={{
                  backgroundColor: "rgba(26, 26, 31, 0.9)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                📋
              </button>
              {generationId && (
                <a
                  data-testid="preview-gallery-link"
                  href="/gallery"
                  aria-label="ギャラリーで見る"
                  title="ギャラリーで見る"
                  className="p-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: "rgba(26, 26, 31, 0.9)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  ↗
                </a>
              )}
            </div>
          </>
        )}

        {/* error */}
        {status === "error" && (
          <div
            data-testid="preview-error"
            className="flex flex-col items-center gap-4 text-center px-8"
            role="alert"
            aria-live="assertive"
          >
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
              生成に失敗しました
            </p>
            {errorMessage && (
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {errorMessage}
              </p>
            )}
            <button
              data-testid="preview-retry-btn"
              onClick={onRetry}
              className="px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
              }}
            >
              再試行
            </button>
          </div>
        )}
      </div>

      {/* Export controls — shown only when image is ready */}
      {status === "complete" && imageUrl && (
        <div
          data-testid="preview-export-controls"
          className="flex flex-wrap items-center gap-2 mt-3"
        >
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
                data-testid={`resolution-${r}-btn`}
                onClick={() => setResolution(r)}
                aria-pressed={resolution === r}
                className="px-3 py-1 text-xs transition-colors"
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

          {/* Download PNG */}
          <button
            data-testid="preview-download-btn"
            onClick={handleDownload}
            disabled={downloading}
            aria-label={`PNG をダウンロード (${resolution})`}
            className="px-3 py-1 rounded text-xs transition-colors"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              cursor: downloading ? "not-allowed" : "pointer",
              opacity: downloading ? 0.6 : 1,
            }}
          >
            {downloading ? "処理中..." : "↓ PNG保存"}
          </button>

          {/* Metadata JSON download */}
          {generationId && generationParams && (
            <button
              data-testid="preview-metadata-btn"
              onClick={handleMetadataDownload}
              aria-label="メタデータをダウンロード"
              className="px-3 py-1 rounded text-xs transition-colors"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
              }}
            >
              ↓ メタデータ (JSON)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
