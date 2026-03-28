---
issue: "ttostudio/ttoClaw#22"
version: "1.0"
author-role: System Engineer
gate: Gate-2
status: draft
---

# 外部設計書 — AI Design Studio

## 1. システム構成概要

```
ブラウザ
  │ HTTP/SSE
  ▼
AI Design Studio (Next.js, port 3700)
  │ API Routes（プロキシ + 履歴保存）
  ├─── HTTP POST ──▶ ComfyUI API (port 3300)
  │                    │ HTTP/WS
  │                    ▼
  │                  ComfyUI Engine (port 8188)
  └─── SQL ────────▶ PostgreSQL (port 5432)
```

- Next.js App Router + API Routes をバックエンドとして使用
- ComfyUI API（既存 Express サーバー）へのプロキシ + PostgreSQL への履歴保存
- SSE（Server-Sent Events）による進捗リレー

---

## 2. API エンドポイント一覧

| メソッド | パス | 概要 | FR |
|---------|------|------|-----|
| POST | `/api/generate` | 画像生成リクエスト | FR-001 |
| GET | `/api/progress/[id]` | SSE 進捗ストリーム | FR-002 |
| GET | `/api/generations` | 生成履歴一覧 | FR-003、FR-005 |
| GET | `/api/generations/[id]` | 生成詳細取得 | FR-005 |
| DELETE | `/api/generations/[id]` | 生成履歴削除 | FR-005 |
| GET | `/api/templates` | テンプレート一覧 | FR-004 |
| GET | `/api/status` | ComfyUI 稼働状態 | NFR-003 |
| GET | `/api/images/[filename]` | 画像プロキシ配信 | FR-006 |

---

## 3. エンドポイント詳細

### 3.1 POST /api/generate

画像生成をリクエストし、ComfyUI API へ転送する。生成完了後に PostgreSQL へ履歴を保存する。

**リクエスト**

```json
{
  "prompt": "blog thumbnail, clean design, mountain sunset",
  "negativePrompt": "blurry, watermark",
  "workflow": "flux-gguf",
  "width": 1024,
  "height": 576,
  "steps": 4,
  "cfgScale": 1.0,
  "seed": -1,
  "templateId": "blog-thumbnail"
}
```

| フィールド | 型 | 必須 | 制約 | 説明 |
|-----------|-----|------|------|------|
| `prompt` | string | ✓ | 1〜1000文字 | 生成プロンプト |
| `negativePrompt` | string | — | 0〜500文字 | ネガティブプロンプト（SD1.5 のみ有効） |
| `workflow` | `"flux-gguf"` \| `"sd15"` | ✓ | enum | ワークフロー種別 |
| `width` | integer | — | 64〜2048、8の倍数 | 画像幅（デフォルト: 1024） |
| `height` | integer | — | 64〜2048、8の倍数 | 画像高さ（デフォルト: 1024） |
| `steps` | integer | — | 1〜150 | ステップ数（デフォルト: Flux=4、SD15=20） |
| `cfgScale` | number | — | 1.0〜30.0 | CFGスケール（デフォルト: Flux=1.0、SD15=7.0） |
| `seed` | integer | — | -1〜2147483647 | シード値（-1=ランダム） |
| `templateId` | string | — | — | 適用したテンプレートID（記録用） |

**レスポンス（202 Accepted）**

```json
{
  "success": true,
  "generationId": "gen_01HXYZ123",
  "promptId": "a3f2c1d4-...",
  "images": [
    {
      "filename": "ComfyUI_00001_.png",
      "subfolder": "",
      "type": "output",
      "url": "/api/images/ComfyUI_00001_.png"
    }
  ],
  "executionTime": 3421
}
```

**エラーレスポンス**

| HTTP | code | 説明 |
|------|------|------|
| 400 | `INVALID_REQUEST` | バリデーションエラー |
| 400 | `PROMPT_TOO_LONG` | プロンプト 1000文字超過 |
| 429 | `QUEUE_FULL` | ComfyUI キュー満杯 |
| 503 | `COMFYUI_UNAVAILABLE` | ComfyUI 停止中 |
| 504 | `GENERATION_TIMEOUT` | 生成タイムアウト（300s） |

---

### 3.2 GET /api/progress/[id]

SSE（Server-Sent Events）で ComfyUI の生成進捗をリレーする。

**パスパラメータ**

| パラメータ | 説明 |
|-----------|------|
| `id` | ComfyUI promptId（UUID形式） |

**SSE イベント形式**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

進捗中:
```
data: {"step": 2, "totalSteps": 4, "progress": 50}
```

完了:
```
data: {"progress": 100, "done": true}
```

エラー:
```
data: {"error": "生成エラーが発生しました"}
```

---

### 3.3 GET /api/generations

生成履歴一覧を返す（PostgreSQL から取得）。

**クエリパラメータ**

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `limit` | integer | 20 | 取得件数（最大 100） |
| `offset` | integer | 0 | オフセット |
| `workflow` | string | — | ワークフローでフィルタ |
| `templateId` | string | — | テンプレートIDでフィルタ |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": [
    {
      "id": "gen_01HXYZ123",
      "prompt": "blog thumbnail, clean design, ...",
      "negativePrompt": null,
      "workflow": "flux-gguf",
      "width": 1024,
      "height": 576,
      "steps": 4,
      "cfgScale": 1.0,
      "seed": 42,
      "templateId": "blog-thumbnail",
      "imageUrl": "/api/images/ComfyUI_00001_.png",
      "imageFilename": "ComfyUI_00001_.png",
      "imageSubfolder": "",
      "executionTime": 3421,
      "status": "success",
      "createdAt": "2026-03-28T10:00:00.000Z"
    }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```

---

### 3.4 GET /api/generations/[id]

特定の生成履歴を取得する。

**レスポンス（200 OK）**

`/api/generations` の `data[n]` と同形式。

**エラー**

| HTTP | code | 説明 |
|------|------|------|
| 404 | `NOT_FOUND` | 指定ID が存在しない |

---

### 3.5 DELETE /api/generations/[id]

生成履歴を削除する（画像ファイル自体は ComfyUI 管理のため削除しない）。

**レスポンス（200 OK）**

```json
{ "success": true }
```

---

### 3.6 GET /api/templates

テンプレート一覧を返す（コード内定義、DB不要）。

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": [
    {
      "id": "blog-thumbnail",
      "name": "ブログサムネイル",
      "workflow": "flux-gguf",
      "width": 1024,
      "height": 576,
      "steps": 4,
      "cfgScale": 1.0,
      "promptPrefix": "blog thumbnail, clean design, "
    },
    {
      "id": "sns-post",
      "name": "SNS投稿画像",
      "workflow": "flux-gguf",
      "width": 1024,
      "height": 1024,
      "steps": 4,
      "cfgScale": 1.0,
      "promptPrefix": "social media post, vibrant, "
    },
    {
      "id": "icon",
      "name": "アイコン",
      "workflow": "flux-gguf",
      "width": 512,
      "height": 512,
      "steps": 4,
      "cfgScale": 1.0,
      "promptPrefix": "icon, minimalist, centered, "
    },
    {
      "id": "illustration",
      "name": "イラスト",
      "workflow": "sd15",
      "width": 512,
      "height": 768,
      "steps": 20,
      "cfgScale": 7.0,
      "promptPrefix": "illustration, detailed, "
    }
  ]
}
```

---

### 3.7 GET /api/status

ComfyUI の稼働状態を返す。

**レスポンス（200 OK）**

```json
{
  "success": true,
  "available": true,
  "device": "mps",
  "vramFree": 8192,
  "vramTotal": 16384,
  "queuePending": 0,
  "queueRunning": 0
}
```

**ComfyUI 停止時（503 Service Unavailable）**

```json
{
  "success": false,
  "available": false,
  "error": "ComfyUI が起動していません",
  "code": "COMFYUI_UNAVAILABLE"
}
```

---

### 3.8 GET /api/images/[filename]

ComfyUI 生成画像をプロキシ配信する。

**クエリパラメータ**

| パラメータ | デフォルト | 説明 |
|-----------|-----------|------|
| `subfolder` | `""` | サブフォルダ |
| `type` | `"output"` | `output` または `temp` |

**レスポンス**

- `Content-Type: image/png`（または `image/jpeg`）
- `Cache-Control: public, max-age=3600`

**バリデーション**

- `filename`: 英数字・ハイフン・アンダースコア・ドットのみ許可。`..` を含む場合は 400
- `subfolder`: `..`・`/`・`\` を含む場合は 400

---

## 4. 共通エラーレスポンス形式

```typescript
interface ErrorResponse {
  success: false;
  error: string;   // ユーザー向けメッセージ（日本語）
  code: string;    // エラーコード
}
```

---

## 5. テンプレート定義（コード内定義）

テンプレートは DB を使用せず、`src/lib/templates.ts` にコード内定義する。

```typescript
export const TEMPLATES: Template[] = [
  {
    id: "blog-thumbnail",
    name: "ブログサムネイル",
    workflow: "flux-gguf",
    width: 1024, height: 576,
    steps: 4, cfgScale: 1.0,
    promptPrefix: "blog thumbnail, clean design, ",
  },
  // ...
];
```

---

## 6. 非機能要件

| ID | 要件 | 設計上の対策 |
|----|------|------------|
| NFR-001 | 生成キュー投入 < 500ms | ComfyUI API への非同期リクエスト。Next.js Route Handler は即 202 を返す |
| NFR-002 | SSE 進捗 1秒以内 | ComfyUI WebSocket → SSE ブリッジ（既存実装と同方式） |
| NFR-003 | ComfyUI 停止時フォールバック | `/api/status` でポーリング、UI に警告バナー表示 |
| NFR-004 | プロンプト長制限 1000文字 | API Route で `prompt.length <= 1000` を検証 |
