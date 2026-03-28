import type { GenerateInput } from "./validators";

const COMFYUI_API_URL =
  process.env["COMFYUI_API_URL"] ?? "http://comfyui-api:3300";

export interface GenerateResult {
  jobId: string;
  promptId: string;
  images?: Array<{
    filename: string;
    subfolder: string;
    type: string;
  }>;
  executionTime?: number;
  seed?: number;
}

export interface StatusResult {
  available: boolean;
  connection: "online" | "offline" | "unknown";
  queuePending?: number;
  queueRunning?: number;
}

export class ComfyUIProxyError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ComfyUIProxyError";
  }
}

export async function generateImage(
  params: GenerateInput
): Promise<GenerateResult> {
  const response = await fetch(`${COMFYUI_API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(310_000),
  });
  if (!response.ok) {
    throw new ComfyUIProxyError(
      response.status,
      `ComfyUI API error: ${response.status}`
    );
  }
  const data = await response.json() as { data?: GenerateResult } | GenerateResult;
  // Handle envelope format from ComfyUI API
  if ("data" in data && data.data) return data.data;
  return data as GenerateResult;
}

export async function getComfyUIStatus(): Promise<StatusResult> {
  try {
    const response = await fetch(`${COMFYUI_API_URL}/api/status`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return { available: false, connection: "offline" };
    }
    const data = await response.json() as { data?: StatusResult } | StatusResult;
    const status = ("data" in data && data.data) ? data.data : data as StatusResult;
    return { ...status, available: true, connection: "online" };
  } catch {
    return { available: false, connection: "offline" };
  }
}

export async function getProgressStream(promptId: string): Promise<Response> {
  const response = await fetch(
    `${COMFYUI_API_URL}/api/progress/${promptId}`,
    { signal: AbortSignal.timeout(310_000) }
  );
  if (!response.ok) {
    throw new ComfyUIProxyError(response.status, `Progress stream error: ${response.status}`);
  }
  return response;
}
