"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TemplateSelector } from "@/components/TemplateSelector";
import { WorkflowSelector } from "@/components/WorkflowSelector";
import { PromptInput } from "@/components/PromptInput";
import { ParamsPanel } from "@/components/ParamsPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { useGeneration } from "@/hooks/useGeneration";
import { getStatus } from "@/lib/api";
import { getTemplate, getDefaultTemplate } from "@/lib/templates";
import type { Template } from "@/lib/templates";

function HomeContent() {
  const searchParams = useSearchParams();
  const { state, generate, reset } = useGeneration();

  // Form state — default to blog-thumbnail template
  const defaultTemplate = getDefaultTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(defaultTemplate);
  const [workflow, setWorkflow] = useState<"flux-gguf" | "sd15">(defaultTemplate.workflow);
  const [prompt, setPrompt] = useState(defaultTemplate.promptPrefix);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [width, setWidth] = useState(defaultTemplate.width);
  const [height, setHeight] = useState(defaultTemplate.height);
  const [steps, setSteps] = useState(defaultTemplate.steps);
  const [seed, setSeed] = useState("");
  const [paramsCollapsed, setParamsCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive collapse
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Poll ComfyUI status
  useEffect(() => {
    getStatus().then((s) => setIsOnline(s.available)).catch(() => setIsOnline(false));
    const id = setInterval(() => {
      getStatus().then((s) => setIsOnline(s.available)).catch(() => setIsOnline(false));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Apply URL params on mount (for "reuse prompt" and template selection flows)
  useEffect(() => {
    const p = searchParams.get("prompt");
    const w = searchParams.get("workflow");
    const wp = searchParams.get("width");
    const hp = searchParams.get("height");
    const sp = searchParams.get("steps");
    const sd = searchParams.get("seed");
    const np = searchParams.get("negativePrompt");
    const tid = searchParams.get("templateId");

    // Apply template preset first (from templates page)
    if (tid) {
      const tpl = getTemplate(tid);
      if (tpl) {
        setSelectedTemplate(tpl);
        setWorkflow(tpl.workflow);
        setWidth(tpl.width);
        setHeight(tpl.height);
        setSteps(tpl.steps);
        if (!p) setPrompt(tpl.promptPrefix);
      }
    }

    if (p) setPrompt(p);
    if (w === "flux-gguf" || w === "sd15") setWorkflow(w);
    if (wp) setWidth(Number(wp));
    if (hp) setHeight(Number(hp));
    if (sp) setSteps(Number(sp));
    if (sd) setSeed(sd);
    if (np) setNegativePrompt(np);
  }, [searchParams]);

  const handleTemplateChange = useCallback((template: Template | null) => {
    setSelectedTemplate(template);
    if (template) {
      setWorkflow(template.workflow);
      setWidth(template.width);
      setHeight(template.height);
      setSteps(template.steps);
      setPrompt((prev) => {
        if (prev.startsWith(template.promptPrefix)) return prev;
        return template.promptPrefix + prev;
      });
    }
  }, []);

  const handleWorkflowChange = useCallback((w: "flux-gguf" | "sd15") => {
    setWorkflow(w);
    if (w === "flux-gguf") setNegativePrompt("");
  }, []);

  const handleGenerate = () => {
    const fullPrompt =
      selectedTemplate && !prompt.startsWith(selectedTemplate.promptPrefix)
        ? selectedTemplate.promptPrefix + prompt
        : prompt;

    generate({
      prompt: fullPrompt,
      negativePrompt: workflow === "sd15" ? negativePrompt : undefined,
      workflow,
      width,
      height,
      steps,
      cfgScale: selectedTemplate?.cfgScale ?? (workflow === "sd15" ? 7.0 : 1.0),
      seed: seed ? Number(seed) : undefined,
      templateId: selectedTemplate?.id,
    });
  };

  const isGenerating = state.status === "queued" || state.status === "processing";
  const canGenerate =
    !isGenerating && isOnline && prompt.trim().length > 0 && prompt.length <= 1000;

  const statusMessage = (() => {
    switch (state.status) {
      case "idle": return "準備完了";
      case "queued": return "キューに追加しました...";
      case "processing": return `生成中 (${state.progress}%)`;
      case "complete": return `✅ 生成完了 — ${width}×${height}px`;
      case "error": return `❌ ${state.errorMessage ?? "エラー"}`;
    }
  })();

  return (
    <div
      data-testid="home-page"
      className="flex flex-col"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      {/* Main content */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left pane: controls */}
        <div
          data-testid="left-pane"
          className="w-full lg:w-2/5 flex flex-col gap-6 p-6 overflow-y-auto"
          style={{
            borderRight: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg-surface)",
          }}
        >
          <TemplateSelector
            selectedId={selectedTemplate?.id ?? null}
            onChange={handleTemplateChange}
          />

          <WorkflowSelector
            value={workflow}
            onChange={handleWorkflowChange}
            disabled={isGenerating}
          />

          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            negativePrompt={negativePrompt}
            onNegativePromptChange={setNegativePrompt}
            showNegative={workflow === "sd15"}
            promptPrefix={selectedTemplate?.promptPrefix ?? null}
            disabled={isGenerating}
          />

          <ParamsPanel
            width={width}
            onWidthChange={setWidth}
            height={height}
            onHeightChange={setHeight}
            steps={steps}
            onStepsChange={setSteps}
            seed={seed}
            onSeedChange={setSeed}
            disabled={isGenerating}
            collapsed={isMobile ? paramsCollapsed : undefined}
            onToggle={isMobile ? () => setParamsCollapsed((v) => !v) : undefined}
          />

          {/* Generate button */}
          <button
            data-testid="generate-btn"
            onClick={handleGenerate}
            disabled={!canGenerate}
            aria-label={
              !isOnline
                ? "ComfyUI オフライン"
                : isGenerating
                  ? "生成中..."
                  : "画像を生成"
            }
            className="w-full py-3 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: !isOnline
                ? "var(--color-bg-elevated)"
                : isGenerating
                  ? "var(--color-accent-muted)"
                  : "var(--color-accent)",
              color: !isOnline
                ? "var(--color-text-disabled)"
                : isGenerating
                  ? "var(--color-accent)"
                  : "#fff",
              borderRadius: "var(--radius-sm)",
              cursor: canGenerate ? "pointer" : "not-allowed",
              border: "none",
            }}
          >
            {isGenerating && (
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            )}
            {!isOnline
              ? "ComfyUI オフライン"
              : isGenerating
                ? "生成中..."
                : "画像を生成"}
          </button>
        </div>

        {/* Right pane: preview */}
        <div
          data-testid="right-pane"
          className="w-full lg:w-3/5 p-6 flex flex-col"
          style={{ backgroundColor: "var(--color-bg-primary)" }}
        >
          <PreviewPanel
            status={state.status}
            progress={state.progress}
            imageUrl={state.imageUrl}
            errorMessage={state.errorMessage}
            width={width}
            height={height}
            prompt={prompt}
            generationId={state.generationId}
            onRetry={reset}
          />
        </div>
      </div>

      {/* Status bar */}
      <div
        data-testid="status-bar"
        className="flex items-center px-6 text-xs h-8"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderTop: "1px solid var(--color-border)",
          color:
            state.status === "error"
              ? "var(--color-error)"
              : state.status === "complete"
                ? "var(--color-success)"
                : "var(--color-text-secondary)",
        }}
        aria-live="polite"
        aria-label="生成ステータス"
      >
        {statusMessage}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 56px)", color: "var(--color-text-secondary)" }}
        >
          読み込み中...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
