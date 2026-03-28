export interface GenerateInput {
  prompt: string;
  negativePrompt?: string;
  workflow: "flux-gguf" | "sd15";
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  templateId?: string;
}

export interface ValidationError {
  code: string;
  message: string;
}

type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const CONTROL_CHAR_RE = /[\x00-\x1f\x7f-\x9f]/g;

function sanitizeText(text: string): string {
  return text.replace(CONTROL_CHAR_RE, "").trim();
}

export function validateGenerateInput(
  body: unknown
): Result<GenerateInput, ValidationError> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: { code: "INVALID_REQUEST", message: "リクエストボディが不正です" } };
  }

  const raw = body as Record<string, unknown>;

  // prompt
  if (typeof raw["prompt"] !== "string" || raw["prompt"].trim() === "") {
    return { ok: false, error: { code: "INVALID_PROMPT", message: "プロンプトは必須です" } };
  }
  const prompt = sanitizeText(raw["prompt"] as string);
  if (prompt.length === 0) {
    return { ok: false, error: { code: "INVALID_PROMPT", message: "プロンプトは必須です" } };
  }
  if (prompt.length > 1000) {
    return { ok: false, error: { code: "PROMPT_TOO_LONG", message: "プロンプトは1000文字以内にしてください" } };
  }

  // negativePrompt
  let negativePrompt: string | undefined;
  if (raw["negativePrompt"] !== undefined) {
    if (typeof raw["negativePrompt"] !== "string") {
      return { ok: false, error: { code: "INVALID_NEGATIVE_PROMPT", message: "ネガティブプロンプトの形式が不正です" } };
    }
    negativePrompt = sanitizeText(raw["negativePrompt"] as string);
    if (negativePrompt.length > 500) {
      return { ok: false, error: { code: "NEGATIVE_PROMPT_TOO_LONG", message: "ネガティブプロンプトは500文字以内にしてください" } };
    }
  }

  // workflow
  const validWorkflows = ["flux-gguf", "sd15"] as const;
  if (!validWorkflows.includes(raw["workflow"] as "flux-gguf" | "sd15")) {
    return { ok: false, error: { code: "INVALID_WORKFLOW", message: "ワークフローはflux-ggufまたはsd15を指定してください" } };
  }
  const workflow = raw["workflow"] as "flux-gguf" | "sd15";

  // width
  let width: number | undefined;
  if (raw["width"] !== undefined) {
    const w = Number(raw["width"]);
    if (!Number.isInteger(w) || w < 64 || w > 2048 || w % 8 !== 0) {
      return { ok: false, error: { code: "INVALID_WIDTH", message: "幅は64〜2048の8の倍数で指定してください" } };
    }
    width = w;
  }

  // height
  let height: number | undefined;
  if (raw["height"] !== undefined) {
    const h = Number(raw["height"]);
    if (!Number.isInteger(h) || h < 64 || h > 2048 || h % 8 !== 0) {
      return { ok: false, error: { code: "INVALID_HEIGHT", message: "高さは64〜2048の8の倍数で指定してください" } };
    }
    height = h;
  }

  // steps
  let steps: number | undefined;
  if (raw["steps"] !== undefined) {
    const s = Number(raw["steps"]);
    if (!Number.isInteger(s) || s < 1 || s > 150) {
      return { ok: false, error: { code: "INVALID_STEPS", message: "ステップ数は1〜150の整数で指定してください" } };
    }
    steps = s;
  }

  // cfgScale
  let cfgScale: number | undefined;
  if (raw["cfgScale"] !== undefined) {
    const c = Number(raw["cfgScale"]);
    if (isNaN(c) || c < 1.0 || c > 30.0) {
      return { ok: false, error: { code: "INVALID_CFG_SCALE", message: "CFGスケールは1.0〜30.0で指定してください" } };
    }
    cfgScale = c;
  }

  // seed
  let seed: number | undefined;
  if (raw["seed"] !== undefined) {
    const sd = Number(raw["seed"]);
    if (!Number.isInteger(sd) || sd < -1 || sd > 2147483647) {
      return { ok: false, error: { code: "INVALID_SEED", message: "シード値は-1〜2147483647の整数で指定してください" } };
    }
    seed = sd;
  }

  // templateId
  let templateId: string | undefined;
  if (raw["templateId"] !== undefined) {
    if (typeof raw["templateId"] !== "string" || !/^[a-z0-9\-]{1,64}$/.test(raw["templateId"] as string)) {
      return { ok: false, error: { code: "INVALID_TEMPLATE_ID", message: "テンプレートIDの形式が不正です" } };
    }
    templateId = raw["templateId"] as string;
  }

  return {
    ok: true,
    value: { prompt, negativePrompt, workflow, width, height, steps, cfgScale, seed, templateId },
  };
}

export function validateFilename(filename: string): boolean {
  return /^[a-zA-Z0-9_\-.]+$/.test(filename) && !filename.includes("..");
}

export function validateSubfolder(subfolder: string): boolean {
  return !subfolder.includes("..") && !subfolder.includes("/") && !subfolder.includes("\\");
}
