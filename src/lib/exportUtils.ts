import type { Generation } from "./api";

const TEMPLATE_LABELS: Record<string, string> = {
  "blog-thumbnail": "ブログサムネイル",
  "sns-post": "SNS投稿",
  "icon": "アイコン",
  "illustration": "イラスト",
};

function buildTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export function buildFilename(templateId: string | null | undefined, ext: "png" | "json" = "png"): string {
  const label = templateId
    ? (TEMPLATE_LABELS[templateId] ?? templateId).replace(/\s+/g, "-")
    : "ai-design";
  return `${label}_${buildTimestamp()}.${ext}`;
}

export function downloadImage(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export async function downloadImageWithResolution(
  imageUrl: string,
  templateId: string | null | undefined,
  resolution: "1x" | "2x"
): Promise<void> {
  const baseFilename = buildFilename(templateId, "png");

  if (resolution === "1x") {
    downloadImage(imageUrl, baseFilename);
    return;
  }

  // 2x: Canvas upscale
  const img = new window.Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth * 2;
  canvas.height = img.naturalHeight * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    downloadImage(imageUrl, baseFilename);
    return;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (!blob) {
      downloadImage(imageUrl, baseFilename);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = baseFilename.replace(/\.png$/, "_2x.png");
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export function downloadMetadataFromGeneration(gen: Generation): void {
  const data = {
    id: gen.id,
    prompt: gen.prompt,
    negative_prompt: gen.negative_prompt,
    workflow: gen.workflow,
    width: gen.width,
    height: gen.height,
    steps: gen.steps,
    cfg_scale: gen.cfg_scale,
    seed: gen.seed,
    template_id: gen.template_id,
    created_at: gen.created_at,
    execution_time: gen.execution_time,
    tags: gen.tags,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(gen.template_id, "json");
  a.click();
  URL.revokeObjectURL(url);
}

export interface PreviewMetadata {
  generationId: string;
  prompt: string;
  negativePrompt?: string;
  workflow: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  seed: number | string;
  templateId?: string | null;
}

export function downloadMetadataFromPreview(meta: PreviewMetadata): void {
  const data = {
    id: meta.generationId,
    prompt: meta.prompt,
    negative_prompt: meta.negativePrompt ?? null,
    workflow: meta.workflow,
    width: meta.width,
    height: meta.height,
    steps: meta.steps,
    cfg_scale: meta.cfgScale,
    seed: meta.seed,
    template_id: meta.templateId ?? null,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(meta.templateId, "json");
  a.click();
  URL.revokeObjectURL(url);
}
