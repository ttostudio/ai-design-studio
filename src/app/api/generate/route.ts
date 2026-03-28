import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { validateGenerateInput } from "@/lib/validators";
import { generateImage, ComfyUIProxyError } from "@/lib/comfyui-client";
import { insertGeneration } from "@/lib/db";
import { getTemplate } from "@/lib/templates";

export const maxDuration = 310;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "JSONの解析に失敗しました" } },
      { status: 400 }
    );
  }

  const validation = validateGenerateInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const input = validation.value;

  // Apply template defaults if templateId is provided
  if (input.templateId) {
    const tpl = getTemplate(input.templateId);
    if (!tpl) {
      return NextResponse.json(
        { error: { code: "TEMPLATE_NOT_FOUND", message: "指定されたテンプレートが見つかりません" } },
        { status: 404 }
      );
    }
    input.workflow = input.workflow ?? tpl.workflow;
    input.width = input.width ?? tpl.width;
    input.height = input.height ?? tpl.height;
    input.steps = input.steps ?? tpl.steps;
    input.cfgScale = input.cfgScale ?? tpl.cfgScale;
  }

  const generationId = `gen_${nanoid(16)}`;

  const params = {
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    workflow: input.workflow,
    width: input.width ?? 1024,
    height: input.height ?? 576,
    steps: input.steps ?? 4,
    cfgScale: input.cfgScale ?? 1.0,
    seed: input.seed ?? -1,
    templateId: input.templateId,
  };

  try {
    const result = await generateImage(params);

    const firstImage = result.images?.[0];
    const imageFilename = firstImage?.filename;
    const imageSubfolder = firstImage?.subfolder ?? "";
    const imageUrl = imageFilename
      ? `/api/images/${encodeURIComponent(imageFilename)}?subfolder=${encodeURIComponent(imageSubfolder)}`
      : undefined;

    await insertGeneration({
      id: generationId,
      promptId: result.promptId,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      workflow: params.workflow,
      width: params.width,
      height: params.height,
      steps: params.steps,
      cfgScale: params.cfgScale,
      seed: result.seed ?? params.seed,
      templateId: params.templateId,
      imageUrl,
      imageFilename,
      imageSubfolder,
      executionTime: result.executionTime,
      status: "success",
    });

    return NextResponse.json({
      data: { generationId, promptId: result.promptId },
    });
  } catch (err) {
    let message = "生成中にエラーが発生しました";
    let status = 500;
    let code = "INTERNAL_ERROR";

    if (err instanceof ComfyUIProxyError) {
      message = `ComfyUI APIエラー: ${err.message}`;
      status = err.status >= 500 ? 503 : 400;
      code = "COMFYUI_ERROR";
    }

    // Best-effort DB save for error record
    await insertGeneration({
      id: generationId,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      workflow: params.workflow,
      width: params.width,
      height: params.height,
      steps: params.steps,
      cfgScale: params.cfgScale,
      seed: params.seed,
      templateId: params.templateId,
      status: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
    }).catch(() => {});

    return NextResponse.json({ error: { code, message } }, { status });
  }
}
