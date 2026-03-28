import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { validateGenerateInput } from "@/lib/validators";
import { generateImage } from "@/lib/comfyui-client";
import {
  insertGeneration,
  updateGenerationProcessing,
  updateGenerationComplete,
  updateGenerationError,
} from "@/lib/db";
import { getTemplate } from "@/lib/templates";
import type { GenerateInput } from "@/lib/validators";

// Fire-and-forget background generation task
async function backgroundGenerate(
  generationId: string,
  params: Required<Pick<GenerateInput, "prompt" | "workflow">> & {
    negativePrompt?: string;
    width: number;
    height: number;
    steps: number;
    cfgScale: number;
    seed: number;
    templateId?: string;
  }
): Promise<void> {
  try {
    await updateGenerationProcessing(generationId);
    const result = await generateImage(params);

    const firstImage = result.images?.[0];
    const imageFilename = firstImage?.filename;
    const imageSubfolder = firstImage?.subfolder ?? "";
    const imageUrl = imageFilename
      ? `/api/images/${encodeURIComponent(imageFilename)}?subfolder=${encodeURIComponent(imageSubfolder)}`
      : undefined;

    await updateGenerationComplete(generationId, {
      promptId: result.promptId,
      imageUrl,
      imageFilename,
      imageSubfolder,
      executionTime: result.executionTime,
      seed: result.seed,
    });
  } catch (err) {
    await updateGenerationError(
      generationId,
      err instanceof Error ? err.message : "生成中にエラーが発生しました"
    ).catch(() => {});
  }
}

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

  // Apply template defaults
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

  // Save queued record to DB
  try {
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
    });
  } catch (err) {
    console.error("[generate] DB insert error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "ジョブの登録に失敗しました" } },
      { status: 500 }
    );
  }

  // Fire and forget — background generation task
  void backgroundGenerate(generationId, params);

  // Return immediately with queued status
  return NextResponse.json({
    data: { generationId, promptId: generationId, status: "queued" },
  });
}
