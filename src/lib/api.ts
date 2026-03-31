"use client";

export interface GenerateParams {
  prompt: string;
  negativePrompt?: string;
  workflow: "flux-gguf" | "sd15";
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  seed?: number;
  templateId?: string;
}

export interface GenerateResponse {
  generationId: string;
  promptId: string;
}

export interface Generation {
  id: string;
  prompt: string;
  negative_prompt: string | null;
  workflow: string;
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  seed: number;
  template_id: string | null;
  image_url: string | null;
  execution_time: number | null;
  status: "success" | "error";
  created_at: string;
  tags: string[];
  is_favorite: boolean;
}

export interface StatusResponse {
  available: boolean;
  connection: "online" | "offline" | "unknown";
}

export async function postGenerate(params: GenerateParams): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json() as { data?: GenerateResponse; error?: { message: string } };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? "生成リクエストに失敗しました");
  }
  if (!json.data) throw new Error("レスポンスが不正です");
  return json.data;
}

export async function getStatus(): Promise<StatusResponse> {
  const res = await fetch("/api/status", { cache: "no-store" });
  const json = await res.json() as { data?: StatusResponse };
  return json.data ?? { available: false, connection: "unknown" };
}

export async function listGenerations(params?: {
  workflow?: string;
  templateId?: string;
  search?: string;
  dateFilter?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  tags?: string[];
  status?: string;
  isFavorite?: boolean;
}): Promise<Generation[]> {
  const query = new URLSearchParams();
  if (params?.workflow) query.set("workflow", params.workflow);
  if (params?.templateId) query.set("templateId", params.templateId);
  if (params?.search) query.set("search", params.search);
  if (params?.dateFilter) query.set("dateFilter", params.dateFilter);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.tags && params.tags.length > 0) query.set("tags", params.tags.join(","));
  if (params?.status) query.set("status", params.status);
  if (params?.isFavorite) query.set("isFavorite", "1");

  const res = await fetch(`/api/generations?${query.toString()}`, { cache: "no-store" });
  const json = await res.json() as { data?: { items: Generation[] } };
  return json.data?.items ?? [];
}

export async function getGeneration(id: string): Promise<{ generation: Generation; similar: Generation[] } | null> {
  const res = await fetch(`/api/generations/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json() as { data?: { generation: Generation; similar: Generation[] } };
  return json.data ?? null;
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const res = await fetch(`/api/generations/${id}/favorite`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isFavorite }),
  });
  if (!res.ok) throw new Error("favorite update failed");
}

export async function updateTags(id: string, tags: string[]): Promise<void> {
  const res = await fetch(`/api/generations/${id}/tags`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) throw new Error("tags update failed");
}
