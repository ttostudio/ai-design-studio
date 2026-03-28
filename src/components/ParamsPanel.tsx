"use client";

interface Props {
  width: number;
  onWidthChange: (v: number) => void;
  height: number;
  onHeightChange: (v: number) => void;
  steps: number;
  onStepsChange: (v: number) => void;
  seed: string;
  onSeedChange: (v: string) => void;
  disabled?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

const WIDTH_OPTIONS = [512, 768, 1024];
const HEIGHT_OPTIONS = [512, 576, 768, 1024];

export function ParamsPanel({
  width,
  onWidthChange,
  height,
  onHeightChange,
  steps,
  onStepsChange,
  seed,
  onSeedChange,
  disabled,
  collapsed,
  onToggle,
}: Props) {
  const handleRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 2147483647);
    onSeedChange(String(randomSeed));
  };

  const selectStyle = {
    backgroundColor: "var(--color-bg-elevated)",
    color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "6px 10px",
    fontSize: "13px",
    width: "100%",
  };

  const content = (
    <div className="flex flex-col gap-4">
      {/* Size */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label
            htmlFor="width-select"
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            幅
          </label>
          <select
            id="width-select"
            data-testid="width-select"
            value={width}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            disabled={disabled}
            style={selectStyle}
          >
            {WIDTH_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}px</option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label
            htmlFor="height-select"
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            高さ
          </label>
          <select
            id="height-select"
            data-testid="height-select"
            value={height}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            disabled={disabled}
            style={selectStyle}
          >
            {HEIGHT_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}px</option>
            ))}
          </select>
        </div>
      </div>

      {/* Steps slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <label
            htmlFor="steps-slider"
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ステップ数
          </label>
          <input
            data-testid="steps-number"
            type="number"
            min={1}
            max={50}
            value={steps}
            onChange={(e) => onStepsChange(Math.max(1, Math.min(50, Number(e.target.value))))}
            disabled={disabled}
            className="w-12 text-center text-xs"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "monospace",
            }}
          />
        </div>
        <input
          id="steps-slider"
          data-testid="steps-slider"
          type="range"
          min={1}
          max={50}
          value={steps}
          onChange={(e) => onStepsChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full"
          style={{ accentColor: "var(--color-accent)" }}
        />
      </div>

      {/* Seed */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="seed-input"
          className="text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          シード値（空欄 = ランダム）
        </label>
        <div className="flex gap-2">
          <input
            id="seed-input"
            data-testid="seed-input"
            type="text"
            value={seed}
            onChange={(e) => onSeedChange(e.target.value)}
            disabled={disabled}
            placeholder="ランダム"
            className="flex-1 px-3 py-1.5 text-xs"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "monospace",
            }}
          />
          <button
            data-testid="seed-random-btn"
            onClick={handleRandomSeed}
            disabled={disabled}
            aria-label="ランダムシードを生成"
            title="ランダムシードを生成"
            className="px-2 py-1.5 rounded text-sm transition-colors"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              color: disabled ? "var(--color-text-disabled)" : "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            🎲
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile: collapsible accordion
  if (onToggle !== undefined) {
    return (
      <div data-testid="params-panel" className="flex flex-col">
        <button
          data-testid="params-toggle"
          onClick={onToggle}
          className="flex items-center justify-between py-2 text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
          aria-expanded={!collapsed}
        >
          <span>パラメータ設定</span>
          <span>{collapsed ? "▼" : "▲"}</span>
        </button>
        {!collapsed && <div className="pt-2">{content}</div>}
      </div>
    );
  }

  return (
    <div data-testid="params-panel">
      <div className="text-xs font-medium mb-3" style={{ color: "var(--color-text-secondary)" }}>
        パラメータ設定
      </div>
      {content}
    </div>
  );
}
