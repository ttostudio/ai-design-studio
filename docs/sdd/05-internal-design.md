---
issue: "ttostudio/ttoClaw#22"
version: "1.0"
author-role: System Engineer
gate: Gate-2
status: draft
---

# 内部設計書 — AI Design Studio

## 1. アーキテクチャ概要

### 1.1 ディレクトリ構成

```
ai-design-studio/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # メイン生成画面
│   │   ├── gallery/page.tsx          # ギャラリー画面
│   │   └── api/
│   │       ├── generate/route.ts     # POST /api/generate
│   │       ├── progress/[id]/route.ts # GET /api/progress/[id]（SSE）
│   │       ├── generations/
│   │       │   ├── route.ts          # GET /api/generations
│   │       │   └── [id]/route.ts     # GET/DELETE /api/generations/[id]
│   │       ├── templates/route.ts    # GET /api/templates
│   │       ├── status/route.ts       # GET /api/status
│   │       └── images/[filename]/route.ts # GET /api/images/[filename]
│   ├── lib/
│   │   ├── db.ts                     # PostgreSQL クライアント（pg）
│   │   ├── comfyui-client.ts         # ComfyUI API クライアント
│   │   ├── templates.ts              # テンプレート定義
│   │   └── validators.ts             # 入力値バリデーション
│   └── components/                   # UI コンポーネント
├── migrations/
│   └── 001_create_generations.sql    # DB マイグレーション
├── docker-compose.yml
└── Dockerfile
```

### 1.2 処理フロー（画像生成）

```
クライアント
  │ POST /api/generate
  ▼
[API Route: generate/route.ts]
  │ 1. 入力値バリデーション（validators.ts）
  │ 2. テンプレート適用（templates.ts）
  │ POST http://comfyui-api:3300/api/generate
  ▼
[ComfyUI API（既存）]
  │ → ComfyUI Engine
  │ ← GenerateResult { promptId, images, executionTime }
  ▼
[API Route: generate/route.ts 続き]
  │ 3. PostgreSQL に generations 行を INSERT
  │ 4. generationId + promptId + images を返す
  ▼
クライアント（202 Accepted）
  │ GET /api/progress/:promptId（SSE）
  ▼
[API Route: progress/[id]/route.ts]
  │ ComfyUI API GET /api/progress/:promptId を SSE リレー
  ▼
クライアント（SSE: 進捗・完了）
```

---

## 2. データベース設計

### 2.1 generations テーブル

```sql
CREATE TABLE generations (
  id            TEXT        PRIMARY KEY,           -- "gen_" + nanoid(16)
  prompt        TEXT        NOT NULL,              -- 生成プロンプト
  negative_prompt TEXT      DEFAULT NULL,          -- ネガティブプロンプト
  workflow      TEXT        NOT NULL,              -- "flux-gguf" | "sd15"
  width         INTEGER     NOT NULL DEFAULT 1024,
  height        INTEGER     NOT NULL DEFAULT 1024,
  steps         INTEGER     NOT NULL,
  cfg_scale     REAL        NOT NULL,
  seed          INTEGER     NOT NULL,              -- 実際に使用されたシード値
  template_id   TEXT        DEFAULT NULL,          -- 適用テンプレートID
  image_url     TEXT        DEFAULT NULL,          -- "/api/images/{filename}"
  image_filename TEXT       DEFAULT NULL,          -- ComfyUI ファイル名
  image_subfolder TEXT      DEFAULT '',
  execution_time INTEGER    DEFAULT NULL,          -- ミリ秒
  status        TEXT        NOT NULL DEFAULT 'success', -- "success" | "error"
  error_message TEXT        DEFAULT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ギャラリー一覧（新しい順）
CREATE INDEX idx_generations_created_at ON generations (created_at DESC);

-- ワークフロー別フィルタ
CREATE INDEX idx_generations_workflow ON generations (workflow);

-- テンプレート別フィルタ
CREATE INDEX idx_generations_template_id ON generations (template_id);
```

### 2.2 ID 生成規則

- 形式: `gen_` + `nanoid(16)`（例: `gen_V1StGXR8_Z5jdHi6B`）
- `nanoid` ライブラリを使用（URL-safe、衝突耐性）

### 2.3 マイグレーション戦略

- `migrations/001_create_generations.sql` に DDL を格納
- コンテナ起動時に `docker-entrypoint-initdb.d/` 経由で自動適用
- 追加変更は `002_*.sql`、`003_*.sql` と連番で管理

---

## 3. 主要モジュール設計

### 3.1 入力値バリデーション（`src/lib/validators.ts`）

セキュリティ設計として、すべての外部入力をサニタイズする。

```typescript
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

export function validateGenerateInput(body: unknown): Result<GenerateInput, ValidationError> {
  // 1. prompt: 必須、1〜1000文字、制御文字除去
  // 2. negativePrompt: 任意、0〜500文字、制御文字除去
  // 3. workflow: "flux-gguf" | "sd15" のみ許可
  // 4. width/height: 64〜2048 の 8 の倍数
  // 5. steps: 1〜150（整数）
  // 6. cfgScale: 1.0〜30.0
  // 7. seed: -1〜2147483647（整数）
  // 8. templateId: 英数字・ハイフンのみ（最大 64文字）
}
```

**サニタイズ方針:**

| 入力フィールド | サニタイズ内容 |
|--------------|--------------|
| `prompt` | 制御文字（`\x00`〜`\x1f`、`\x7f`〜`\x9f`）を除去。前後の空白をトリム |
| `negativePrompt` | 同上 |
| `workflow` | allowlist（`flux-gguf`、`sd15`）のみ許可。その他は 400 エラー |
| `width`, `height` | 数値型を強制、範囲外は 400 エラー |
| `seed` | 整数型を強制、範囲外は 400 エラー |
| `templateId` | `^[a-z0-9\-]{1,64}$` にマッチしない場合は 400 エラー |
| `filename`（画像配信） | `^[a-zA-Z0-9_\-\.]+$` のみ許可、`..` を含む場合は 400 エラー |

### 3.2 ComfyUI API クライアント（`src/lib/comfyui-client.ts`）

既存 ComfyUI API（port 3300）へのプロキシを担当する。

```typescript
const COMFYUI_API_URL = process.env.COMFYUI_API_URL ?? "http://comfyui-api:3300";

export async function generateImage(params: GenerateInput): Promise<GenerateResult> {
  const response = await fetch(`${COMFYUI_API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(310_000), // 310秒（ComfyUI 300s + マージン）
  });
  if (!response.ok) throw new ComfyUIProxyError(response);
  return response.json();
}

export async function getStatus(): Promise<StatusResult> {
  const response = await fetch(`${COMFYUI_API_URL}/api/status`, {
    signal: AbortSignal.timeout(5_000),
  });
  return response.json();
}
```

### 3.3 DB クライアント（`src/lib/db.ts`）

```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,              // 最大接続数（単独使用のため少なめ）
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function insertGeneration(data: InsertGenerationData): Promise<void> {
  await pool.query(
    `INSERT INTO generations
     (id, prompt, negative_prompt, workflow, width, height, steps, cfg_scale, seed,
      template_id, image_url, image_filename, image_subfolder, execution_time, status, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [/* ... パラメータバインディング ... */]
  );
}

export async function listGenerations(opts: ListOptions): Promise<GenerationRow[]> {
  // プリペアドステートメントでSQLインジェクション防止
  const { workflow, templateId, limit, offset } = opts;
  // ...
}
```

**SQLインジェクション対策:** すべてのクエリをパラメータバインディング（`$1`, `$2`, ...）で実装。動的 SQL 文字列結合は禁止。

### 3.4 テンプレート定義（`src/lib/templates.ts`）

DBを使用せず、コード内にテンプレートを定義する（要件定義 FR-004 に基づく）。

```typescript
export interface Template {
  id: string;
  name: string;
  workflow: "flux-gguf" | "sd15";
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  promptPrefix: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "blog-thumbnail",
    name: "ブログサムネイル",
    workflow: "flux-gguf",
    width: 1024, height: 576,
    steps: 4, cfgScale: 1.0,
    promptPrefix: "blog thumbnail, clean design, ",
  },
  {
    id: "sns-post",
    name: "SNS投稿画像",
    workflow: "flux-gguf",
    width: 1024, height: 1024,
    steps: 4, cfgScale: 1.0,
    promptPrefix: "social media post, vibrant, ",
  },
  {
    id: "icon",
    name: "アイコン",
    workflow: "flux-gguf",
    width: 512, height: 512,
    steps: 4, cfgScale: 1.0,
    promptPrefix: "icon, minimalist, centered, ",
  },
  {
    id: "illustration",
    name: "イラスト",
    workflow: "sd15",
    width: 512, height: 768,
    steps: 20, cfgScale: 7.0,
    promptPrefix: "illustration, detailed, ",
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
```

---

## 4. セキュリティ設計

### 4.1 入力値サニタイズ方針

| レイヤー | 対策 |
|---------|------|
| API Route（リクエスト受信） | `validators.ts` でバリデーション＆サニタイズ（制御文字除去、型強制、長さ制限） |
| DB クエリ | パラメータバインディングのみ使用（動的 SQL 結合禁止） |
| 画像プロキシ | `filename` / `subfolder` にパストラバーサル防止チェック |
| ComfyUI プロキシ | allowlist 済みワークフロー名のみ転送 |

### 4.2 プロンプトインジェクション対策

- プロンプト文字列は ComfyUI の JSON ペイロードの文字列フィールドとして渡すため、HTML エスケープは不要
- ただし、長さ上限（1000文字）と制御文字除去により異常入力を排除

### 4.3 パストラバーサル対策

画像プロキシ（`GET /api/images/[filename]`）にて以下を検証:
```typescript
// filename
if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename) || filename.includes("..")) {
  return NextResponse.json({ error: "不正なファイル名" }, { status: 400 });
}
// subfolder
if (subfolder && (subfolder.includes("..") || subfolder.includes("/") || subfolder.includes("\\"))) {
  return NextResponse.json({ error: "不正なサブフォルダ" }, { status: 400 });
}
```

### 4.4 レート制限

- ComfyUI API 側に既存のレート制限（`rate-limiter.ts`）が存在する
- Design Studio 側では追加のレート制限は設けない（単独使用のため）
- ComfyUI の `QUEUE_FULL`（429）エラーをそのままクライアントに返す

---

## 5. 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql://designstudio:designstudio@db:5432/designstudio` |
| `COMFYUI_API_URL` | ComfyUI API の URL | `http://comfyui-api:3300` |
| `PORT` | Next.js 起動ポート | `3700` |

---

## 6. Docker Compose 設計

```yaml
services:
  app:
    build: .
    ports: ["3700:3700"]
    environment:
      - DATABASE_URL=postgresql://designstudio:designstudio@db:5432/designstudio
      - COMFYUI_API_URL=http://host.docker.internal:3300
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: designstudio
      POSTGRES_USER: designstudio
      POSTGRES_PASSWORD: designstudio
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U designstudio"]
      interval: 5s
      retries: 5

volumes:
  db_data:
```

---

## 7. テスタビリティ設計

### 7.1 ユニットテスト対象

| モジュール | テスト観点 |
|-----------|-----------|
| `validators.ts` | プロンプト長上限（1000文字）、制御文字除去、workflow allowlist、数値範囲チェック |
| `templates.ts` | テンプレート取得・存在確認 |
| `comfyui-client.ts` | ComfyUI 停止時のエラーハンドリング（fetch モック） |
| `db.ts` | SQL パラメータバインディング（pg モック） |

### 7.2 結合テスト対象

| シナリオ | 確認内容 |
|---------|---------|
| 正常生成フロー | POST /api/generate → 202、DB に generations 行が存在する |
| ギャラリー取得 | GET /api/generations → 保存済み行が返る |
| ComfyUI 停止時 | GET /api/status → 503、available: false |
| バリデーションエラー | prompt=空文字 → 400 INVALID_REQUEST |

### 7.3 並行性考慮

- 複数生成リクエストが同時に届いた場合、ComfyUI API のキュー（rate-limiter）で直列化される
- PostgreSQL の `INSERT` はアトミックなため、並行 INSERT による重複 ID は `nanoid` の衝突耐性（16文字）により実質的に発生しない
- 並行テストケース: 同時 3リクエストを投入し、全 INSERT が成功することを確認（結合テスト）

---

## 8. エラーハンドリング方針

| エラー種別 | 処理 |
|----------|------|
| ComfyUI 停止（fetch エラー） | 503 + `COMFYUI_UNAVAILABLE` を返す。DB には記録しない |
| 生成タイムアウト | 504 + `GENERATION_TIMEOUT` を返す。DB には `status: "error"` で記録 |
| DB 接続エラー | 500 + `INTERNAL_ERROR` を返す。生成は成功しているため画像 URL をログ出力 |
| バリデーションエラー | 400 + `INVALID_REQUEST` または個別コードを返す |
