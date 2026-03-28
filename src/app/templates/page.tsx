"use client";

import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";

const WORKFLOW_LABELS: Record<string, string> = {
  "flux-gguf": "Flux-schnell",
  "sd15": "SD1.5",
};

export default function TemplatesPage() {
  const router = useRouter();

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/?templateId=${templateId}`);
  };

  return (
    <div data-testid="templates-page" className="min-h-screen p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          テンプレート一覧
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          プリセット設定を選択して画像生成を開始できます
        </p>
      </div>

      {/* Templates grid: 2 cols on lg+, 1 col on mobile */}
      <div
        data-testid="templates-grid"
        className="grid gap-6 grid-cols-1 lg:grid-cols-2"
      >
        {TEMPLATES.map((template) => {
          const aspectRatio = `${template.width} / ${template.height}`;

          return (
            <div
              key={template.id}
              data-testid={`template-card-${template.id}`}
              className="rounded-lg overflow-hidden flex flex-col"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              {/* Preview placeholder */}
              <div
                data-testid={`template-preview-${template.id}`}
                className="flex items-center justify-center"
                style={{
                  aspectRatio,
                  backgroundColor: "var(--color-bg-elevated)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🎨</span>
                  <span className="text-xs" style={{ color: "var(--color-text-disabled)" }}>
                    {template.width} × {template.height}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2
                    data-testid={`template-name-${template.id}`}
                    className="font-semibold text-base"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {template.name}
                  </h2>
                  <span
                    data-testid={`template-workflow-badge-${template.id}`}
                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--color-accent-muted)",
                      color: "var(--color-accent)",
                      border: "1px solid var(--color-accent)",
                    }}
                  >
                    {WORKFLOW_LABELS[template.workflow] ?? template.workflow}
                  </span>
                </div>

                <p
                  data-testid={`template-size-${template.id}`}
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {template.width} × {template.height}
                </p>

                <p
                  data-testid={`template-prefix-${template.id}`}
                  className="text-xs truncate"
                  style={{ color: "var(--color-text-secondary)" }}
                  title={template.promptPrefix}
                >
                  {template.promptPrefix}
                </p>

                <button
                  data-testid={`template-use-btn-${template.id}`}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="mt-auto w-full py-2.5 rounded font-medium text-sm transition-colors"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "#fff",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                  }}
                >
                  このテンプレートで生成
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
