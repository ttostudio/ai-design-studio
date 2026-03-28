"use client";

import Image from "next/image";
import { ProgressBar } from "./ProgressBar";
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
  onRetry,
}: Props) {
  const aspectRatio = `${width} / ${height}`;

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `ai-design-${generationId ?? "image"}.png`;
    a.click();
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
                data-testid="preview-download-btn"
                onClick={handleDownload}
                aria-label="画像をダウンロード"
                title="ダウンロード"
                className="p-2 rounded text-sm transition-colors"
                style={{
                  backgroundColor: "rgba(26, 26, 31, 0.9)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                ↓
              </button>
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
    </div>
  );
}
