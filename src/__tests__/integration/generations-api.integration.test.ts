/**
 * 結合テスト: POST /api/generate, GET /api/generations
 * 実 PostgreSQL (localhost:5437) に接続して動作確認する。
 * モック不使用。
 */

import { Pool } from "pg";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3700";
const DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://designstudio:designstudio@localhost:5437/designstudio";

let pool: Pool;

beforeAll(async () => {
  pool = new Pool({ connectionString: DB_URL });
  // DB 接続確認
  await pool.query("SELECT 1");
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  // 各テスト前にテーブルをクリア
  await pool.query("TRUNCATE TABLE generations RESTART IDENTITY CASCADE");
});

// ── IT-01-01: POST /api/generate が DB にレコードを保存する ─────────────────
it("IT-01-01: POST /api/generate persists record in DB", async () => {
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "mountain landscape at sunset",
      workflow: "flux-gguf",
      width: 1024,
      height: 576,
    }),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data).toBeDefined();
  const generationId: string = body.data.generationId;
  expect(typeof generationId).toBe("string");
  expect(generationId.startsWith("gen_")).toBe(true);

  // 実DBで確認（バックグラウンド処理が即時実行される場合 queued or processing or error も許容）
  const row = await pool.query(
    "SELECT * FROM generations WHERE id = $1",
    [generationId]
  );
  expect(row.rows).toHaveLength(1);
  expect(row.rows[0].prompt).toBe("mountain landscape at sunset");
  expect(["queued", "processing", "error"]).toContain(row.rows[0].status);
  expect(row.rows[0].workflow).toBe("flux-gguf");
  expect(row.rows[0].width).toBe(1024);
  expect(row.rows[0].height).toBe(576);
});

// ── IT-01-02: テンプレート適用でサイズ・template_id が DB に保存される ─────────
// 注: プロンプトプレフィックス付与はフロントエンド側で行い、API にはすでに完成した
// プロンプトが渡される。この結合テストでは完成済みプロンプトを送信し、
// テンプレート ID・サイズが正しく保存されることを検証する。
it("IT-01-02: template metadata (id, width, height) is persisted in DB", async () => {
  // フロントエンドがプレフィックスを付与した状態を模倣
  const fullPrompt = "blog thumbnail, clean design, tech blog about AI";
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: fullPrompt,
      workflow: "flux-gguf",
      templateId: "blog-thumbnail",
      width: 1024,
      height: 576,
    }),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  const generationId: string = body.data.generationId;

  const row = await pool.query(
    "SELECT * FROM generations WHERE id = $1",
    [generationId]
  );
  expect(row.rows).toHaveLength(1);
  // プロンプトが正しく保存されている
  expect(row.rows[0].prompt).toContain("blog thumbnail, clean design,");
  expect(row.rows[0].prompt).toContain("tech blog about AI");
  // テンプレートのデフォルトサイズが適用されている
  expect(row.rows[0].width).toBe(1024);
  expect(row.rows[0].height).toBe(576);
  expect(row.rows[0].template_id).toBe("blog-thumbnail");
});

// ── IT-01-03: 連続 5 件リクエストが全件 DB に保存される ───────────────────────
it("IT-01-03: 5 concurrent requests are all persisted in DB", async () => {
  const promises = Array.from({ length: 5 }, (_, i) =>
    fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `test prompt ${i}`,
        workflow: "flux-gguf",
        width: 512,
        height: 512,
      }),
    })
  );

  const results = await Promise.all(promises);
  results.forEach((r) => expect(r.status).toBe(200));

  const count = await pool.query(
    "SELECT COUNT(*) FROM generations WHERE status IN ('queued', 'processing', 'error')"
  );
  expect(parseInt(count.rows[0].count as string)).toBe(5);
});

// ── IT-01-04: バリデーションエラー (prompt なし) は 400 ─────────────────────
it("IT-01-04: missing prompt returns 400 and does not persist in DB", async () => {
  const before = await pool.query("SELECT COUNT(*) FROM generations");
  const beforeCount = parseInt(before.rows[0].count as string);

  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow: "flux-gguf", width: 512, height: 512 }),
  });

  expect(res.status).toBe(400);

  const after = await pool.query("SELECT COUNT(*) FROM generations");
  expect(parseInt(after.rows[0].count as string)).toBe(beforeCount);
});

// ── IT-02: GET /api/generations — DB から一覧取得 ─────────────────────────────
it("IT-02-01: GET /api/generations returns completed generations from DB", async () => {
  // テストデータ挿入
  await pool.query(`
    INSERT INTO generations (id, prompt, workflow, width, height, steps, cfg_scale, seed, status, image_url, created_at)
    VALUES
      ('g1', 'mountain sunset', 'flux-gguf', 1024, 576, 4, 1.0, -1, 'success', '/api/images/g1.png', NOW()),
      ('g2', 'ocean waves', 'flux-gguf', 1024, 576, 4, 1.0, -1, 'success', '/api/images/g2.png', NOW() - interval '1 hour'),
      ('g3', 'pending task', 'flux-gguf', 512, 512, 4, 1.0, -1, 'queued', NULL, NOW())
  `);

  const res = await fetch(`${BASE_URL}/api/generations`);
  expect(res.status).toBe(200);
  const body = await res.json();

  // success + image_url ありのみ表示
  expect(body.data.items).toHaveLength(2);
  const ids = body.data.items.map((i: { id: string }) => i.id);
  expect(ids).toContain("g1");
  expect(ids).toContain("g2");
  expect(ids).not.toContain("g3");
});

// ── IT-02-02: ページネーションが DB レベルで動作する ──────────────────────────
it("IT-02-02: pagination works at DB level", async () => {
  // 15 件挿入
  const inserts = Array.from({ length: 15 }, (_, i) => ({
    id: `job-pg-${i}`,
    prompt: `prompt ${i}`,
    ts: `NOW() - interval '${i} minutes'`,
  }));
  for (const row of inserts) {
    await pool.query(
      `INSERT INTO generations (id, prompt, workflow, width, height, steps, cfg_scale, seed, status, image_url, created_at)
       VALUES ($1, $2, 'flux-gguf', 512, 512, 4, 1.0, -1, 'success', '/img/${row.id}.png', ${row.ts})`,
      [row.id, row.prompt]
    );
  }

  const page1Res = await fetch(`${BASE_URL}/api/generations?limit=5&offset=0`);
  const page2Res = await fetch(`${BASE_URL}/api/generations?limit=5&offset=5`);

  const page1 = await page1Res.json();
  const page2 = await page2Res.json();

  expect(page1.data.items).toHaveLength(5);
  expect(page2.data.items).toHaveLength(5);

  const page1Ids = page1.data.items.map((i: { id: string }) => i.id);
  const page2Ids = page2.data.items.map((i: { id: string }) => i.id);
  // 重複なし
  page1Ids.forEach((id: string) => expect(page2Ids).not.toContain(id));
});

// ── IT-02-03: 検索クエリで DB の ILIKE 検索が動作する ────────────────────────
it("IT-02-03: search query filters by prompt using ILIKE in DB", async () => {
  await pool.query(`
    INSERT INTO generations (id, prompt, workflow, width, height, steps, cfg_scale, seed, status, image_url)
    VALUES
      ('s1', 'beautiful sunset over mountains', 'flux-gguf', 1024, 576, 4, 1.0, -1, 'success', '/img/s1.png'),
      ('s2', 'city skyline at night', 'flux-gguf', 1024, 576, 4, 1.0, -1, 'success', '/img/s2.png'),
      ('s3', 'sunset beach paradise', 'flux-gguf', 1024, 576, 4, 1.0, -1, 'success', '/img/s3.png')
  `);

  const res = await fetch(`${BASE_URL}/api/generations?search=sunset`);
  expect(res.status).toBe(200);
  const body = await res.json();

  expect(body.data.items).toHaveLength(2);
  body.data.items.forEach((item: { prompt: string }) => {
    expect(item.prompt.toLowerCase()).toContain("sunset");
  });
});

// ── IT-03: GET /api/generations/:id — 個別取得 ──────────────────────────────
// API は gen_[A-Za-z0-9_-]{16} 形式を必須とするため、POST 経由で ID を取得する
it("IT-03-01: GET /api/generations/:id returns correct record from DB", async () => {
  // POST /api/generate で生成して ID を取得
  const genRes = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "detail prompt",
      workflow: "flux-gguf",
      width: 512,
      height: 512,
    }),
  });
  expect(genRes.status).toBe(200);
  const genBody = await genRes.json();
  const generationId = genBody.data.generationId;

  const res = await fetch(`${BASE_URL}/api/generations/${generationId}`);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.id).toBe(generationId);
  expect(body.data.prompt).toBe("detail prompt");
});

it("IT-03-02: GET /api/generations/:id returns 404 for non-existent valid-format ID", async () => {
  // gen_ + 16 chars の形式だが DB に存在しない ID
  const res = await fetch(`${BASE_URL}/api/generations/gen_aaaaaaaaaaaaaaaa`);
  expect(res.status).toBe(404);
});
