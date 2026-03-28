"use client";

interface Props {
  value: "flux-gguf" | "sd15";
  onChange: (value: "flux-gguf" | "sd15") => void;
  disabled?: boolean;
}

const WORKFLOWS = [
  { value: "flux-gguf" as const, label: "Flux-schnell（高速・高品質）" },
  { value: "sd15" as const, label: "SD1.5（詳細・イラスト向き）" },
];

export function WorkflowSelector({ value, onChange, disabled }: Props) {
  return (
    <div data-testid="workflow-selector" className="flex flex-col gap-2">
      <label
        htmlFor="workflow-select"
        className="text-xs font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        ワークフロー
      </label>
      <select
        id="workflow-select"
        data-testid="workflow-select"
        value={value}
        onChange={(e) => onChange(e.target.value as "flux-gguf" | "sd15")}
        disabled={disabled}
        className="w-full px-3 py-2 rounded text-sm"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {WORKFLOWS.map((w) => (
          <option key={w.value} value={w.value}>
            {w.label}
          </option>
        ))}
      </select>
    </div>
  );
}
