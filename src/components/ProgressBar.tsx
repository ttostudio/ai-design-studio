"use client";

interface Props {
  progress: number;
  "data-testid"?: string;
}

export function ProgressBar({ progress, "data-testid": testId = "progress-bar" }: Props) {
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <div data-testid={testId} className="w-full">
      <div
        className="w-full rounded"
        style={{
          height: "8px",
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`生成進捗 ${pct}%`}
      >
        <div
          data-testid="progress-bar-fill"
          className="h-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--color-progress)",
            boxShadow: "0 0 8px rgba(124, 106, 247, 0.6)",
          }}
        />
      </div>
      <div
        className="mt-1 text-right text-xs"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {pct}%
      </div>
    </div>
  );
}
