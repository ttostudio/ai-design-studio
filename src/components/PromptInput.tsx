"use client";

const MAX_PROMPT = 1000;
const MAX_NEGATIVE = 500;

interface Props {
  prompt: string;
  onPromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  showNegative: boolean;
  promptPrefix: string | null;
  disabled?: boolean;
}

export function PromptInput({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  showNegative,
  promptPrefix,
  disabled,
}: Props) {
  const isOverLimit = prompt.length > MAX_PROMPT;

  return (
    <div data-testid="prompt-input" className="flex flex-col gap-3">
      {/* Prompt prefix badge */}
      {promptPrefix && (
        <div
          data-testid="prompt-prefix-badge"
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: "var(--color-accent-muted)",
            color: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
          }}
        >
          プレフィックス: {promptPrefix}
        </div>
      )}

      {/* Main prompt */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="prompt-textarea"
          className="text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          プロンプト
        </label>
        <div className="relative">
          <textarea
            id="prompt-textarea"
            data-testid="prompt-textarea"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={5}
            disabled={disabled}
            placeholder="画像の説明を入力（例: a futuristic city at night, neon lights）"
            maxLength={MAX_PROMPT + 50}
            aria-label="プロンプト入力"
            aria-describedby="prompt-count"
            className="w-full px-3 py-2 text-sm resize-none"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
              border: `1px solid ${isOverLimit ? "var(--color-error)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-sm)",
              outline: "none",
            }}
          />
          <span
            id="prompt-count"
            data-testid="prompt-count"
            className="absolute bottom-2 right-2 text-xs"
            style={{ color: isOverLimit ? "var(--color-error)" : "var(--color-text-disabled)" }}
          >
            {prompt.length} / {MAX_PROMPT}
          </span>
        </div>
      </div>

      {/* Negative prompt (SD1.5 only) */}
      {showNegative && (
        <div data-testid="negative-prompt-wrapper" className="flex flex-col gap-1">
          <label
            htmlFor="negative-prompt-textarea"
            className="text-xs font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ネガティブプロンプト
          </label>
          <textarea
            id="negative-prompt-textarea"
            data-testid="negative-prompt-textarea"
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            rows={2}
            disabled={disabled}
            placeholder="除外したい要素（例: blurry, low quality）"
            maxLength={MAX_NEGATIVE + 50}
            aria-label="ネガティブプロンプト入力"
            className="w-full px-3 py-2 text-sm resize-none"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              outline: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
