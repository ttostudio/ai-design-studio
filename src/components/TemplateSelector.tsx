"use client";

import { TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import type { Template } from "@/lib/templates";

interface Props {
  selectedId: string | null;
  onChange: (template: Template | null) => void;
}

export function TemplateSelector({ selectedId, onChange }: Props) {
  return (
    <div data-testid="template-selector" className="flex flex-col gap-2">
      <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
        テンプレート
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {/* Custom (no template) */}
        <button
          data-testid="template-chip-custom"
          onClick={() => onChange(null)}
          title="テンプレートを使わずカスタム設定で生成します"
          className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: selectedId === null ? "var(--color-accent)" : "var(--color-bg-elevated)",
            color: selectedId === null ? "#fff" : "var(--color-text-secondary)",
            border: "1px solid",
            borderColor: selectedId === null ? "var(--color-accent)" : "var(--color-border)",
          }}
        >
          カスタム
        </button>

        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            data-testid={`template-chip-${template.id}`}
            onClick={() => onChange(template)}
            title={template.description}
            className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: selectedId === template.id ? "var(--color-accent)" : "var(--color-bg-elevated)",
              color: selectedId === template.id ? "#fff" : "var(--color-text-secondary)",
              border: "1px solid",
              borderColor: selectedId === template.id ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            {template.name}
            {template.id === DEFAULT_TEMPLATE_ID && selectedId !== template.id && (
              <span
                className="ml-1 text-xs"
                style={{ color: "var(--color-text-disabled)", fontSize: "0.65rem" }}
              >
                ★
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Description of selected template */}
      {selectedId !== null && (
        <p
          data-testid="template-description"
          className="text-xs"
          style={{ color: "var(--color-text-secondary)", lineHeight: "1.4" }}
        >
          {TEMPLATES.find((t) => t.id === selectedId)?.description}
        </p>
      )}
    </div>
  );
}
