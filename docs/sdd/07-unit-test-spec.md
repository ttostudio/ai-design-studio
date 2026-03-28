---
issue: "ttostudio/ttoClaw#22"
version: "1.0"
author-role: QA Engineer
gate: Gate-4
status: draft
---

# ユニットテスト仕様書 — AI Design Studio

## 概要

- ツール: Jest 29 + ts-jest
- 実行コマンド: `pnpm test`
- カバレッジ: `pnpm test --coverage`
- DBモック: `jest.mock` / `pg` をモック
- ComfyUI モック: `jest.mock` または `nock`

---

## UT-01: API ルート — POST /api/generate

### UT-01-01: 正常系 — 有効なリクエストでキューIDを返す

```typescript
// tests/unit/routes/generate.test.ts
it('valid prompt returns job_id', async () => {
  const res = await request(app).post('/api/generate').send({
    prompt: 'test image',
    workflow: 'flux-gguf',
    width: 1024,
    height: 576,
  });
  expect(res.status).toBe(202);
  expect(res.body).toHaveProperty('job_id');
});
```

### UT-01-02: 異常系 — prompt 未指定（400）

```typescript
it('missing prompt returns 400', async () => {
  const res = await request(app).post('/api/generate').send({
    workflow: 'flux-gguf',
  });
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/prompt/i);
});
```

### UT-01-03: 異常系 — prompt が 1000 文字超（400）

```typescript
it('prompt over 1000 chars returns 400', async () => {
  const res = await request(app).post('/api/generate').send({
    prompt: 'a'.repeat(1001),
    workflow: 'flux-gguf',
  });
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/1000/);
});
```

### UT-01-04: 異常系 — 不正な workflow 値（400）

```typescript
it('invalid workflow returns 400', async () => {
  const res = await request(app).post('/api/generate').send({
    prompt: 'test',
    workflow: 'unknown-workflow',
  });
  expect(res.status).toBe(400);
});
```

### UT-01-05: 異常系 — ComfyUI が 503 を返す（502）

```typescript
it('ComfyUI unavailable returns 502 with fallback message', async () => {
  comfyuiMock.post('/api/generate').reply(503, { error: 'Service unavailable' });
  const res = await request(app).post('/api/generate').send({
    prompt: 'test',
    workflow: 'flux-gguf',
  });
  expect(res.status).toBe(502);
  expect(res.body.error).toMatch(/ComfyUI/i);
});
```

### UT-01-06: 異常系 — ComfyUI 接続タイムアウト（502）

```typescript
it('ComfyUI timeout returns 502', async () => {
  comfyuiMock.post('/api/generate').delay(6000).reply(200, {});
  const res = await request(app).post('/api/generate').send({
    prompt: 'test',
    workflow: 'flux-gguf',
  });
  expect(res.status).toBe(502);
});
```

### UT-01-07: 正常系 — ネガティブプロンプト（SD1.5 のみ）

```typescript
it('negative_prompt accepted for sd15 workflow', async () => {
  const res = await request(app).post('/api/generate').send({
    prompt: 'beautiful portrait',
    negative_prompt: 'blurry, ugly',
    workflow: 'sd15',
  });
  expect(res.status).toBe(202);
});
```

### UT-01-08: 異常系 — Flux でネガティブプロンプト指定（無視 or 警告）

```typescript
it('negative_prompt with flux workflow is ignored or warned', async () => {
  const res = await request(app).post('/api/generate').send({
    prompt: 'test',
    negative_prompt: 'blurry',
    workflow: 'flux-gguf',
  });
  // ネガティブプロンプトは無視される（400 にはしない）
  expect(res.status).toBe(202);
});
```

---

## UT-02: API ルート — GET /api/progress/:id

### UT-02-01: 正常系 — 存在するジョブのSSEストリーム開始

```typescript
it('existing job streams SSE events', async () => {
  const jobId = 'test-job-001';
  jobStoreMock.set(jobId, { status: 'processing', progress: 50 });

  const res = await request(app)
    .get(`/api/progress/${jobId}`)
    .set('Accept', 'text/event-stream');
  expect(res.headers['content-type']).toMatch(/text\/event-stream/);
});
```

### UT-02-02: 異常系 — 存在しないジョブID（404）

```typescript
it('unknown job_id returns 404', async () => {
  const res = await request(app).get('/api/progress/nonexistent-job');
  expect(res.status).toBe(404);
});
```

### UT-02-03: SSE イベントフォーマット検証

```typescript
it('SSE event format is valid', () => {
  const event = formatSSEEvent({ type: 'progress', data: { percent: 50 } });
  expect(event).toMatch(/^event: progress\n/);
  expect(event).toMatch(/data: \{.*"percent":50.*\}/);
  expect(event).toEndWith('\n\n');
});
```

### UT-02-04: SSE — complete イベントで画像URLを含む

```typescript
it('complete event includes image_url', () => {
  const event = formatSSEEvent({
    type: 'complete',
    data: { image_url: '/images/generated/abc.png' },
  });
  expect(event).toMatch(/"image_url"/);
});
```

---

## UT-03: API ルート — GET /api/gallery

### UT-03-01: 正常系 — 生成履歴一覧を返す

```typescript
it('returns list of generated images', async () => {
  galleryRepoMock.findAll.mockResolvedValue([
    { id: 1, prompt: 'test', image_url: '/images/1.png', created_at: new Date() },
  ]);
  const res = await request(app).get('/api/gallery');
  expect(res.status).toBe(200);
  expect(res.body.items).toHaveLength(1);
});
```

### UT-03-02: 正常系 — ページネーション（limit/offset）

```typescript
it('supports limit and offset query params', async () => {
  const res = await request(app).get('/api/gallery?limit=10&offset=20');
  expect(res.status).toBe(200);
  expect(galleryRepoMock.findAll).toHaveBeenCalledWith(
    expect.objectContaining({ limit: 10, offset: 20 })
  );
});
```

### UT-03-03: 正常系 — 検索クエリで絞り込み

```typescript
it('filters by search query', async () => {
  const res = await request(app).get('/api/gallery?q=blog+thumbnail');
  expect(res.status).toBe(200);
  expect(galleryRepoMock.findAll).toHaveBeenCalledWith(
    expect.objectContaining({ search: 'blog thumbnail' })
  );
});
```

---

## UT-04: API ルート — GET /api/templates

### UT-04-01: 全テンプレート一覧を返す

```typescript
it('returns all templates', async () => {
  const res = await request(app).get('/api/templates');
  expect(res.status).toBe(200);
  expect(res.body.templates).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'blog-thumbnail' }),
      expect.objectContaining({ id: 'sns-post' }),
      expect.objectContaining({ id: 'icon' }),
      expect.objectContaining({ id: 'illustration' }),
    ])
  );
});
```

### UT-04-02: 各テンプレートに必須フィールドが含まれる

```typescript
it('each template has required fields', async () => {
  const res = await request(app).get('/api/templates');
  for (const tpl of res.body.templates) {
    expect(tpl).toHaveProperty('id');
    expect(tpl).toHaveProperty('name');
    expect(tpl).toHaveProperty('workflow');
    expect(tpl).toHaveProperty('width');
    expect(tpl).toHaveProperty('height');
    expect(tpl).toHaveProperty('prompt_prefix');
  }
});
```

---

## UT-05: ComfyUI クライアント

### UT-05-01: generateImage — 正常系

```typescript
// tests/unit/services/comfyui-client.test.ts
it('submitWorkflow returns job_id', async () => {
  nock('http://localhost:3300')
    .post('/api/generate')
    .reply(200, { job_id: 'comfy-job-001' });

  const client = new ComfyUIClient('http://localhost:3300');
  const result = await client.submitWorkflow({
    workflow: 'flux-gguf',
    prompt: 'test',
    width: 1024,
    height: 576,
  });
  expect(result.job_id).toBe('comfy-job-001');
});
```

### UT-05-02: generateImage — 接続エラー時に ComfyUIUnavailableError をスロー

```typescript
it('throws ComfyUIUnavailableError on ECONNREFUSED', async () => {
  nock('http://localhost:3300')
    .post('/api/generate')
    .replyWithError({ code: 'ECONNREFUSED' });

  const client = new ComfyUIClient('http://localhost:3300');
  await expect(
    client.submitWorkflow({ workflow: 'flux-gguf', prompt: 'test', width: 512, height: 512 })
  ).rejects.toThrow(ComfyUIUnavailableError);
});
```

### UT-05-03: generateImage — 503 レスポンス時に ComfyUIUnavailableError をスロー

```typescript
it('throws ComfyUIUnavailableError on 503', async () => {
  nock('http://localhost:3300')
    .post('/api/generate')
    .reply(503, { error: 'overloaded' });

  const client = new ComfyUIClient('http://localhost:3300');
  await expect(
    client.submitWorkflow({ workflow: 'flux-gguf', prompt: 'test', width: 512, height: 512 })
  ).rejects.toThrow(ComfyUIUnavailableError);
});
```

### UT-05-04: getProgress — ポーリング結果を返す

```typescript
it('getProgress returns status object', async () => {
  nock('http://localhost:3300')
    .get('/api/progress/comfy-job-001')
    .reply(200, { status: 'processing', progress: 75 });

  const client = new ComfyUIClient('http://localhost:3300');
  const result = await client.getProgress('comfy-job-001');
  expect(result.progress).toBe(75);
});
```

### UT-05-05: リトライロジック — 一時的エラー後にリトライして成功

```typescript
it('retries on 500 and eventually succeeds', async () => {
  nock('http://localhost:3300')
    .post('/api/generate')
    .reply(500)
    .post('/api/generate')
    .reply(200, { job_id: 'retry-job-001' });

  const client = new ComfyUIClient('http://localhost:3300', { maxRetries: 2 });
  const result = await client.submitWorkflow({
    workflow: 'flux-gguf',
    prompt: 'test',
    width: 512,
    height: 512,
  });
  expect(result.job_id).toBe('retry-job-001');
});
```

---

## UT-06: テンプレートサービス

### UT-06-01: テンプレートIDからプリセット取得

```typescript
// tests/unit/services/template-service.test.ts
it('getTemplate returns preset for blog-thumbnail', () => {
  const tpl = TemplateService.getTemplate('blog-thumbnail');
  expect(tpl.workflow).toBe('flux-gguf');
  expect(tpl.width).toBe(1024);
  expect(tpl.height).toBe(576);
  expect(tpl.prompt_prefix).toContain('blog thumbnail');
});
```

### UT-06-02: テンプレートプロンプト合成

```typescript
it('buildPrompt prepends prefix to user prompt', () => {
  const tpl = TemplateService.getTemplate('sns-post');
  const prompt = TemplateService.buildPrompt(tpl, 'sunny beach');
  expect(prompt).toBe(`${tpl.prompt_prefix}sunny beach`);
});
```

### UT-06-03: 存在しないテンプレートIDでエラー

```typescript
it('getTemplate throws on unknown id', () => {
  expect(() => TemplateService.getTemplate('nonexistent')).toThrow();
});
```

### UT-06-04: SD1.5 テンプレートはワークフロー sd15

```typescript
it('illustration template uses sd15 workflow', () => {
  const tpl = TemplateService.getTemplate('illustration');
  expect(tpl.workflow).toBe('sd15');
});
```

---

## UT-07: DB リポジトリ

### UT-07-01: saveGeneration — 正常系

```typescript
// tests/unit/repositories/generation-repository.test.ts
it('saveGeneration inserts and returns id', async () => {
  dbMock.query.mockResolvedValue({ rows: [{ id: 42 }] });
  const repo = new GenerationRepository(dbMock);
  const id = await repo.save({
    prompt: 'test',
    workflow: 'flux-gguf',
    width: 1024,
    height: 576,
    job_id: 'job-001',
  });
  expect(id).toBe(42);
});
```

### UT-07-02: findById — 存在しない場合 null を返す

```typescript
it('findById returns null for unknown id', async () => {
  dbMock.query.mockResolvedValue({ rows: [] });
  const repo = new GenerationRepository(dbMock);
  const result = await repo.findById(999);
  expect(result).toBeNull();
});
```

### UT-07-03: updateStatus — image_url と status を更新

```typescript
it('updateStatus sets image_url and status', async () => {
  dbMock.query.mockResolvedValue({ rowCount: 1 });
  const repo = new GenerationRepository(dbMock);
  await repo.updateStatus(42, 'completed', '/images/generated/abc.png');
  expect(dbMock.query).toHaveBeenCalledWith(
    expect.stringMatching(/UPDATE/),
    expect.arrayContaining(['completed', '/images/generated/abc.png', 42])
  );
});
```

---

## UT-08: 入力バリデーション共通

### UT-08-01: サイズバリデーション — 最小・最大

```typescript
it('width must be between 256 and 2048', () => {
  expect(validateSize(256)).toBe(true);
  expect(validateSize(2048)).toBe(true);
  expect(validateSize(255)).toBe(false);
  expect(validateSize(2049)).toBe(false);
});
```

### UT-08-02: ステップ数バリデーション

```typescript
it('steps must be between 1 and 50', () => {
  expect(validateSteps(1)).toBe(true);
  expect(validateSteps(50)).toBe(true);
  expect(validateSteps(0)).toBe(false);
  expect(validateSteps(51)).toBe(false);
});
```

---

## テスト実行コマンド

```bash
# ユニットテスト全件
pnpm test

# カバレッジ付き
pnpm test --coverage

# 特定ファイルのみ
pnpm test tests/unit/services/comfyui-client.test.ts

# ウォッチモード
pnpm test --watch
```

## jest.config.ts（参考）

```typescript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 70,
    },
  },
};
```
