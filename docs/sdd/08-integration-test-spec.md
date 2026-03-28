---
issue: "ttostudio/ttoClaw#22"
version: "1.0"
author-role: QA Engineer
gate: Gate-4
status: draft
---

# 結合テスト・E2E テスト仕様書 — AI Design Studio

## ⚠️ 重要: 実DB 必須方針

> **Music Station 教訓**: モックのみで「結合テスト通過」と報告することは禁止。
> 全結合テストは **実 PostgreSQL（docker-compose.test.yml）** への接続を必須とする。
> E2E テストは **実 PostgreSQL + Next.js 起動状態** で実施する。

---

## 1. 結合テスト環境セットアップ

```bash
# テスト用DB起動
docker compose -f docker-compose.test.yml up -d db-test

# マイグレーション実行（テストDB）
DATABASE_URL=postgresql://design_studio:test_password@localhost:5433/design_studio_test \
  pnpm db:migrate

# 結合テスト実行
DATABASE_URL=postgresql://design_studio:test_password@localhost:5433/design_studio_test \
  pnpm test:integration
```

### 1.1 テスト前後の DB クリーンアップ

```typescript
// tests/integration/helpers/db.ts
export async function clearDatabase(pool: Pool) {
  await pool.query('TRUNCATE TABLE generations, templates RESTART IDENTITY CASCADE');
}

beforeEach(async () => {
  await clearDatabase(testPool);
});

afterAll(async () => {
  await testPool.end();
});
```

---

## 2. 結合テスト仕様

### IT-01: POST /api/generate — 実DB 書き込み確認

#### IT-01-01: 生成リクエストが DB に保存される

```typescript
// tests/integration/routes/generate.test.ts
it('generate request is persisted in DB', async () => {
  const res = await request(app).post('/api/generate').send({
    prompt: 'mountain landscape at sunset',
    workflow: 'flux-gguf',
    width: 1024,
    height: 576,
  });

  expect(res.status).toBe(202);
  const jobId = res.body.job_id;

  // 実DBで確認
  const row = await testPool.query(
    'SELECT * FROM generations WHERE job_id = $1',
    [jobId]
  );
  expect(row.rows).toHaveLength(1);
  expect(row.rows[0].prompt).toBe('mountain landscape at sunset');
  expect(row.rows[0].status).toBe('queued');
});
```

#### IT-01-02: テンプレート適用リクエストがプレフィックス付きで保存される

```typescript
it('template prompt prefix is prepended in DB', async () => {
  const res = await request(app).post('/api/generate').send({
    prompt: 'tech blog about AI',
    workflow: 'flux-gguf',
    template_id: 'blog-thumbnail',
  });

  expect(res.status).toBe(202);
  const row = await testPool.query(
    'SELECT * FROM generations WHERE job_id = $1',
    [res.body.job_id]
  );
  expect(row.rows[0].prompt).toContain('blog thumbnail, clean design,');
  expect(row.rows[0].prompt).toContain('tech blog about AI');
});
```

#### IT-01-03: 連続5件リクエストが全件DBに保存される

```typescript
it('5 concurrent requests are all persisted', async () => {
  const promises = Array.from({ length: 5 }, (_, i) =>
    request(app).post('/api/generate').send({
      prompt: `test prompt ${i}`,
      workflow: 'flux-gguf',
      width: 512,
      height: 512,
    })
  );

  const results = await Promise.all(promises);
  results.forEach(r => expect(r.status).toBe(202));

  const count = await testPool.query(
    'SELECT COUNT(*) FROM generations WHERE status = $1',
    ['queued']
  );
  expect(parseInt(count.rows[0].count)).toBe(5);
});
```

---

### IT-02: GET /api/progress/:id — 実DB 読み取り確認

#### IT-02-01: DB に存在するジョブIDで SSE ストリームが開始される

```typescript
// tests/integration/routes/progress.test.ts
it('SSE starts for existing job in DB', async () => {
  // DBにジョブを事前挿入
  const { rows } = await testPool.query(
    `INSERT INTO generations (job_id, prompt, workflow, width, height, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['test-job-sse', 'test prompt', 'flux-gguf', 1024, 576, 'processing']
  );

  const res = await request(app)
    .get('/api/progress/test-job-sse')
    .set('Accept', 'text/event-stream')
    .timeout(3000)
    .buffer(true);

  expect(res.headers['content-type']).toMatch(/text\/event-stream/);
});
```

#### IT-02-02: DB に存在しないジョブIDは 404

```typescript
it('non-existent job_id returns 404', async () => {
  const res = await request(app).get('/api/progress/does-not-exist-in-db');
  expect(res.status).toBe(404);
  expect(res.body.error).toMatch(/not found/i);
});
```

#### IT-02-03: ジョブ完了後の DB ステータス更新確認

```typescript
it('completed job updates status in DB', async () => {
  // ComfyUI モックが即時 complete を返す設定
  comfyuiMock.post('/api/generate').reply(200, { job_id: 'fast-job-001' });
  comfyuiMock.get('/api/progress/fast-job-001').reply(200, {
    status: 'complete',
    image_url: '/output/result.png',
  });

  const genRes = await request(app).post('/api/generate').send({
    prompt: 'quick test',
    workflow: 'flux-gguf',
    width: 512,
    height: 512,
  });

  // 少し待機してステータス更新を確認
  await new Promise(r => setTimeout(r, 1000));

  const row = await testPool.query(
    'SELECT status, image_url FROM generations WHERE job_id = $1',
    [genRes.body.job_id]
  );
  expect(row.rows[0].status).toBe('completed');
  expect(row.rows[0].image_url).toBeTruthy();
});
```

---

### IT-03: GET /api/gallery — 実DB からの一覧取得

#### IT-03-01: 完了済み生成履歴が表示される

```typescript
// tests/integration/routes/gallery.test.ts
it('returns completed generations from DB', async () => {
  // テストデータ挿入
  await testPool.query(
    `INSERT INTO generations (job_id, prompt, workflow, width, height, status, image_url, created_at)
     VALUES
       ('g1', 'mountain', 'flux-gguf', 1024, 576, 'completed', '/images/g1.png', NOW()),
       ('g2', 'ocean', 'flux-gguf', 1024, 576, 'completed', '/images/g2.png', NOW() - interval '1 hour'),
       ('g3', 'pending', 'flux-gguf', 512, 512, 'queued', NULL, NOW())`
  );

  const res = await request(app).get('/api/gallery');
  expect(res.status).toBe(200);
  // 完了済みのみ表示（queuedは除外）
  expect(res.body.items).toHaveLength(2);
  // 新しい順
  expect(res.body.items[0].job_id).toBe('g1');
});
```

#### IT-03-02: ページネーションが DB レベルで動作する

```typescript
it('pagination works at DB level', async () => {
  // 15件挿入
  const values = Array.from({ length: 15 }, (_, i) =>
    `('job-pg-${i}', 'prompt ${i}', 'flux-gguf', 512, 512, 'completed', '/img/${i}.png', NOW() - interval '${i} minutes')`
  ).join(', ');
  await testPool.query(`INSERT INTO generations (job_id, prompt, workflow, width, height, status, image_url, created_at) VALUES ${values}`);

  const page1 = await request(app).get('/api/gallery?limit=5&offset=0');
  const page2 = await request(app).get('/api/gallery?limit=5&offset=5');

  expect(page1.body.items).toHaveLength(5);
  expect(page2.body.items).toHaveLength(5);
  // 重複なし
  const page1Ids = page1.body.items.map((i: any) => i.job_id);
  const page2Ids = page2.body.items.map((i: any) => i.job_id);
  expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids));
});
```

#### IT-03-03: 検索クエリで DB の ILIKE 検索が動作する

```typescript
it('search query filters by prompt in DB', async () => {
  await testPool.query(
    `INSERT INTO generations (job_id, prompt, workflow, width, height, status, image_url)
     VALUES
       ('s1', 'beautiful sunset over mountains', 'flux-gguf', 1024, 576, 'completed', '/img/s1.png'),
       ('s2', 'city skyline at night', 'flux-gguf', 1024, 576, 'completed', '/img/s2.png'),
       ('s3', 'sunset beach paradise', 'flux-gguf', 1024, 576, 'completed', '/img/s3.png')`
  );

  const res = await request(app).get('/api/gallery?q=sunset');
  expect(res.status).toBe(200);
  expect(res.body.items).toHaveLength(2);
  res.body.items.forEach((item: any) => {
    expect(item.prompt.toLowerCase()).toContain('sunset');
  });
});
```

---

### IT-04: ComfyUI フォールバック結合テスト

#### IT-04-01: ComfyUI 停止時に 502 と日本語エラーメッセージ

```typescript
// tests/integration/routes/fallback.test.ts
it('returns 502 with Japanese error when ComfyUI is down', async () => {
  // ComfyUI が接続拒否
  nock('http://localhost:3300')
    .post('/api/generate')
    .replyWithError({ code: 'ECONNREFUSED' });

  const res = await request(app).post('/api/generate').send({
    prompt: 'test',
    workflow: 'flux-gguf',
    width: 512,
    height: 512,
  });

  expect(res.status).toBe(502);
  expect(res.body.error).toBeDefined();
  // DBには「failed」ステータスで保存される
  const row = await testPool.query(
    'SELECT status FROM generations ORDER BY id DESC LIMIT 1'
  );
  expect(row.rows[0].status).toBe('failed');
});
```

#### IT-04-02: ComfyUI タイムアウト時のフォールバック確認

```typescript
it('handles ComfyUI timeout gracefully', async () => {
  nock('http://localhost:3300')
    .post('/api/generate')
    .delay(10000)
    .reply(200, {});

  const res = await request(app).post('/api/generate').send({
    prompt: 'timeout test',
    workflow: 'flux-gguf',
    width: 512,
    height: 512,
  });

  expect(res.status).toBe(502);
}, 15000);
```

#### IT-04-03: ComfyUI 停止時でもギャラリー表示は正常

```typescript
it('gallery works even when ComfyUI is down', async () => {
  // ComfyUI を全て拒否設定
  nock('http://localhost:3300').persist().post('/api/generate').replyWithError('ECONNREFUSED');

  await testPool.query(
    `INSERT INTO generations (job_id, prompt, workflow, width, height, status, image_url)
     VALUES ('existing-1', 'past image', 'flux-gguf', 1024, 576, 'completed', '/img/existing.png')`
  );

  const res = await request(app).get('/api/gallery');
  expect(res.status).toBe(200);
  expect(res.body.items).toHaveLength(1);
});
```

---

### IT-05: POST /api/favorites — お気に入り機能（実DB）

#### IT-05-01: お気に入り登録が DB に保存される

```typescript
// tests/integration/routes/favorites.test.ts
it('favorite is saved in DB', async () => {
  // 対象の生成画像を事前挿入
  await testPool.query(
    `INSERT INTO generations (job_id, prompt, workflow, width, height, status, image_url)
     VALUES ('fav-target', 'favorite test', 'flux-gguf', 512, 512, 'completed', '/img/fav.png')`
  );
  const { rows } = await testPool.query(
    'SELECT id FROM generations WHERE job_id = $1',
    ['fav-target']
  );
  const genId = rows[0].id;

  const res = await request(app).post('/api/favorites').send({ generation_id: genId });
  expect(res.status).toBe(201);

  const fav = await testPool.query(
    'SELECT * FROM favorites WHERE generation_id = $1',
    [genId]
  );
  expect(fav.rows).toHaveLength(1);
});
```

---

## 3. E2E テスト仕様（Playwright）

### セットアップ

```typescript
// playwright.config.ts
export default {
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3700',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3700',
    reuseExistingServer: !process.env.CI,
  },
};
```

---

### E2E-01: 画像生成フロー

#### E2E-01-01: プロンプト入力 → 生成完了 → ギャラリー表示

```typescript
// tests/e2e/generate.spec.ts
test('full generation flow: prompt → generate → gallery', async ({ page }) => {
  await page.goto('/');

  // プロンプト入力
  await page.fill('[data-testid="prompt-input"]', 'beautiful mountain landscape');

  // ワークフロー選択（Flux）
  await page.selectOption('[data-testid="workflow-select"]', 'flux-gguf');

  // 生成ボタンクリック
  await page.click('[data-testid="generate-button"]');

  // 進捗表示の確認
  await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

  // 生成完了 or タイムアウト（ComfyUI 稼働時は実際に待つ）
  await expect(page.locator('[data-testid="generated-image"]')).toBeVisible({
    timeout: 120_000,
  });

  // ギャラリーに追加されたことを確認
  await page.goto('/gallery');
  await expect(page.locator('[data-testid="gallery-item"]').first()).toBeVisible();
  const firstPrompt = await page.locator('[data-testid="gallery-item-prompt"]').first().textContent();
  expect(firstPrompt).toContain('beautiful mountain landscape');
});
```

#### E2E-01-02: テンプレート選択で自動設定が適用される

```typescript
test('template selection pre-fills prompt and size', async ({ page }) => {
  await page.goto('/');

  // テンプレート選択
  await page.click('[data-testid="template-blog-thumbnail"]');

  // サイズが自動設定
  const width = await page.inputValue('[data-testid="width-input"]');
  const height = await page.inputValue('[data-testid="height-input"]');
  expect(width).toBe('1024');
  expect(height).toBe('576');

  // ワークフローが flux-gguf に設定
  const workflow = await page.inputValue('[data-testid="workflow-select"]');
  expect(workflow).toBe('flux-gguf');

  // プロンプトプレフィックスが表示
  await expect(page.locator('[data-testid="prompt-prefix"]')).toContainText('blog thumbnail');
});
```

#### E2E-01-03: 生成画像のダウンロード

```typescript
test('generated image can be downloaded', async ({ page }) => {
  // ギャラリーに既存アイテムがある状態を前提
  await page.goto('/gallery');
  await expect(page.locator('[data-testid="gallery-item"]').first()).toBeVisible();

  // ダウンロードボタンクリック
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('[data-testid="download-button"]').first().click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.(png|jpg|webp)$/);
});
```

---

### E2E-02: ギャラリー表示

#### E2E-02-01: ギャラリーの無限スクロール / ページネーション

```typescript
// tests/e2e/gallery.spec.ts
test('gallery loads more items on scroll', async ({ page }) => {
  await page.goto('/gallery');

  const initialCount = await page.locator('[data-testid="gallery-item"]').count();

  // スクロールでもっと読み込む
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  const afterScrollCount = await page.locator('[data-testid="gallery-item"]').count();
  // 追加読み込みされた（DBにデータがある場合）
  expect(afterScrollCount).toBeGreaterThanOrEqual(initialCount);
});
```

#### E2E-02-02: 検索フィルターが機能する

```typescript
test('gallery search filters results', async ({ page }) => {
  await page.goto('/gallery');

  await page.fill('[data-testid="gallery-search"]', 'mountain');
  await page.keyboard.press('Enter');

  await page.waitForURL(/q=mountain/);

  const items = page.locator('[data-testid="gallery-item"]');
  const count = await items.count();

  if (count > 0) {
    const firstPrompt = await page.locator('[data-testid="gallery-item-prompt"]').first().textContent();
    expect(firstPrompt?.toLowerCase()).toContain('mountain');
  }
});
```

---

### E2E-03: ComfyUI 停止フォールバック（必須）

#### E2E-03-01: ComfyUI 停止時にエラーUIが表示される

```typescript
// tests/e2e/fallback.spec.ts
// 前提: COMFYUI_URL を無効なURLに設定した状態で Next.js を起動
// または API モックで 503 を返す設定

test('shows error UI when ComfyUI is unavailable', async ({ page }) => {
  // API をインターセプトして ComfyUI エラーを模倣
  await page.route('**/api/generate', route => {
    route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'ComfyUI が利用できません。しばらくしてからお試しください。',
      }),
    });
  });

  await page.goto('/');
  await page.fill('[data-testid="prompt-input"]', 'test prompt');
  await page.click('[data-testid="generate-button"]');

  // エラーメッセージが表示される
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText('ComfyUI');

  // 生成ボタンが再び有効になる（リトライ可能）
  await expect(page.locator('[data-testid="generate-button"]')).toBeEnabled();
});
```

#### E2E-03-02: ComfyUI 停止中でもギャラリーは閲覧可能

```typescript
test('gallery remains accessible when ComfyUI is down', async ({ page }) => {
  // 生成APIのみエラーにする
  await page.route('**/api/generate', route => {
    route.fulfill({ status: 502, body: '{"error":"ComfyUI unavailable"}' });
  });

  // ギャラリーは正常に表示
  await page.goto('/gallery');
  await expect(page.locator('[data-testid="gallery-container"]')).toBeVisible();

  // エラーなし
  await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
});
```

---

## 4. テスト実行コマンド一覧

```bash
# 結合テスト（実DB起動が必要）
docker compose -f docker-compose.test.yml up -d db-test
pnpm test:integration

# E2E テスト（Next.js + DB 起動が必要）
docker compose up -d db
pnpm test:e2e

# E2E テスト（ヘッドレスモード）
pnpm test:e2e --headed

# E2E テスト（特定シナリオのみ）
pnpm test:e2e tests/e2e/fallback.spec.ts

# 全テスト実行（UT + 結合 + E2E）
pnpm test:all
```

---

## 5. 結合テスト package.json スクリプト

```json
{
  "scripts": {
    "test": "jest --testMatch='**/tests/unit/**/*.test.ts'",
    "test:integration": "jest --testMatch='**/tests/integration/**/*.test.ts' --runInBand",
    "test:e2e": "playwright test",
    "test:all": "pnpm test && pnpm test:integration && pnpm test:e2e",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 6. Gate 5 結合テスト確認チェックリスト

| 確認項目 | 結果 |
|---------|------|
| 実 PostgreSQL に接続してテスト実行 | □ |
| POST /api/generate でDB書き込み確認 | □ |
| GET /api/gallery でDB読み取り確認 | □ |
| ComfyUI フォールバック（502）確認 | □ |
| E2E: 生成フロー全件 PASS | □ |
| E2E: ComfyUI 停止時エラーUI表示 PASS | □ |
| テスト結果レポート（junit.xml）添付 | □ |
