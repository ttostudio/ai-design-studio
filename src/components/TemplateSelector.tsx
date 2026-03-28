"use client";

import { TEMPLATES } from "@/lib/templates";
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
            className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: selectedId === template.id ? "var(--color-accent)" : "var(--color-bg-elevated)",
              color: selectedId === template.id ? "#fff" : "var(--color-text-secondary)",
              border: "1px solid",
              borderColor: selectedId === template.id ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}
