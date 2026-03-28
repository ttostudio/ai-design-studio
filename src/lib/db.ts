import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env["DATABASE_URL"] ??
    "postgresql://designstudio:designstudio@db:5432/designstudio",
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export interface GenerationRow {
  id: string;
  prompt_id: string | null;
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
  image_filename: string | null;
  image_subfolder: string;
  execution_time: number | null;
  status: "queued" | "processing" | "success" | "error";
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface InsertGenerationData {
  id: string;
  prompt: string;
  negativePrompt?: string;
  workflow: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  seed: number;
  templateId?: string;
}

export interface CompleteGenerationData {
  promptId?: string;
  imageUrl?: string;
  imageFilename?: string;
  imageSubfolder?: string;
  executionTime?: number;
  seed?: number;
}

export interface ListOptions {
  workflow?: string;
  templateId?: string;
  search?: string;
  dateFilter?: "today" | "week" | "month";
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
}

export async function insertGeneration(data: InsertGenerationData): Promise<void> {
  await pool.query(
    `INSERT INTO generations
     (id, prompt, negative_prompt, workflow, width, height, steps, cfg_scale, seed,
      template_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'queued')`,
    [
      data.id,
      data.prompt,
      data.negativePrompt ?? null,
      data.workflow,
      data.width,
      data.height,
      data.steps,
      data.cfgScale,
      data.seed,
      data.templateId ?? null,
    ]
  );
}

export async function updateGenerationProcessing(id: string): Promise<void> {
  await pool.query(
    "UPDATE generations SET status = 'processing' WHERE id = $1",
    [id]
  );
}

export async function updateGenerationComplete(
  id: string,
  data: CompleteGenerationData
): Promise<void> {
  await pool.query(
    `UPDATE generations
     SET status = 'success',
         prompt_id = $2,
         image_url = $3,
         image_filename = $4,
         image_subfolder = $5,
         execution_time = $6,
         seed = COALESCE($7, seed),
         completed_at = NOW()
     WHERE id = $1`,
    [
      id,
      data.promptId ?? null,
      data.imageUrl ?? null,
      data.imageFilename ?? null,
      data.imageSubfolder ?? "",
      data.executionTime ?? null,
      data.seed ?? null,
    ]
  );
}

export async function updateGenerationError(id: string, errorMessage: string): Promise<void> {
  await pool.query(
    "UPDATE generations SET status = 'error', error_message = $2, completed_at = NOW() WHERE id = $1",
    [id, errorMessage]
  );
}

export async function deleteGeneration(id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM generations WHERE id = $1",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getGenerationByPromptId(promptId: string): Promise<GenerationRow | null> {
  const result = await pool.query<GenerationRow>(
    "SELECT * FROM generations WHERE prompt_id = $1 ORDER BY created_at DESC LIMIT 1",
    [promptId]
  );
  return result.rows[0] ?? null;
}

export async function listGenerations(opts: ListOptions): Promise<GenerationRow[]> {
  const params: unknown[] = [];
  const conditions: string[] = ["status IN ('success')", "image_url IS NOT NULL"];

  if (opts.workflow) {
    params.push(opts.workflow);
    conditions.push(`workflow = $${params.length}`);
  }

  if (opts.templateId) {
    params.push(opts.templateId);
    conditions.push(`template_id = $${params.length}`);
  }

  if (opts.search) {
    params.push(`%${opts.search}%`);
    conditions.push(`prompt ILIKE $${params.length}`);
  }

  if (opts.dateFilter === "today") {
    conditions.push("created_at >= CURRENT_DATE");
  } else if (opts.dateFilter === "week") {
    conditions.push("created_at >= CURRENT_DATE - INTERVAL '7 days'");
  } else if (opts.dateFilter === "month") {
    conditions.push("created_at >= CURRENT_DATE - INTERVAL '30 days'");
  }

  const orderBy = opts.sort === "oldest" ? "ASC" : "DESC";
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  params.push(limit, offset);

  const query = `
    SELECT * FROM generations
    WHERE ${conditions.join(" AND ")}
    ORDER BY created_at ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query<GenerationRow>(query, params);
  return result.rows;
}

export async function getGenerationById(id: string): Promise<GenerationRow | null> {
  const result = await pool.query<GenerationRow>(
    "SELECT * FROM generations WHERE id = $1",
    [id]
  );
  return result.rows[0] ?? null;
}
