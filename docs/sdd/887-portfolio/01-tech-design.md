# #887 AI Design Studio — ポートフォリオギャラリー強化 技術設計

## アーキテクチャ概要

Next.js App Router / PostgreSQL 構成を維持。新規追加はマイグレーション・API Route・コンポーネントのみ。

---

## DBマイグレーション

### ファイル: `migrations/002_portfolio.sql`

```sql
-- FR-02-3: タグ機能
ALTER TABLE generations ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- FR-04-2: お気に入り
ALTER TABLE generations ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_generations_is_favorite ON generations (is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_generations_tags        ON generations USING GIN (tags);
```

### 変更後の `GenerationRow` 型追加フィールド

| カラム | 型 | デフォルト | 用途 |
|--------|----|-----------|------|
| `tags` | `TEXT[]` | `'{}'` | タグフィルタ・表示 |
| `is_favorite` | `BOOLEAN` | `FALSE` | お気に入りフィルタ・トグル |

---

## API 設計

### 既存 API 変更: `GET /api/generations`

**追加クエリパラメータ:**

| パラメータ | 型 | 説明 |
|------------|-----|------|
| `workflow` | string | `flux-gguf` または `sd15`（既存・現状未使用だったものを有効化） |
| `tags` | string（カンマ区切り） | 指定タグを全て含む件数 (`&& ARRAY[...]` で絞り込み） |
| `status` | string | `success`/`error`/未指定（未指定時は `success` のみ） |
| `isFavorite` | `1` | お気に入りのみ表示 |

**`db.ts` の `ListOptions` 型に追加:**

```typescript
export interface ListOptions {
  // ...existing...
  workflow?: string;
  templateId?: string;
  search?: string;
  dateFilter?: "today" | "week" | "month";
  sort?: "newest" | "oldest";
  limit?: number;
  offset?: number;
  // 追加
  tags?: string[];           // FR-02-3
  status?: "success" | "error" | "all";  // FR-02-6（デフォルト: success）
  isFavorite?: boolean;      // FR-04-3
}
```

**`listGenerations` の追加 WHERE 句:**

```sql
-- tags: 指定タグを全て含む
AND tags @> $N  -- $N = ARRAY['tag1','tag2']

-- status: all の場合はフィルタなし、error の場合は error のみ
AND status = 'error'  -- status=error の場合

-- isFavorite
AND is_favorite = TRUE
```

---

### 新規 API: `GET /api/generations/[id]`

**ファイル:** `src/app/api/generations/[id]/route.ts`

```
GET /api/generations/[id]
```

**レスポンス:**
```json
{
  "data": {
    "generation": { ...GenerationRow },
    "similar": [ ...GenerationRow[] ]  // 同一template_idの直近6件（自分を除く）
  }
}
```

**実装方針:**
- `getGenerationById(id)` で取得（既存関数）
- `template_id` がある場合、`listGenerations({ templateId, limit: 7, sort: "newest" })` で取得し自分を除く6件を返す
- 存在しない場合は `{ status: 404 }`

---

### 新規 API: `PUT /api/generations/[id]/favorite`

**ファイル:** `src/app/api/generations/[id]/favorite/route.ts`

```
PUT /api/generations/[id]/favorite
Body: { "isFavorite": true | false }
```

**レスポンス:**
```json
{ "data": { "isFavorite": true } }
```

**DB関数追加（`db.ts`）:**

```typescript
export async function updateGenerationFavorite(id: string, isFavorite: boolean): Promise<boolean> {
  const result = await pool.query(
    "UPDATE generations SET is_favorite = $2 WHERE id = $1",
    [id, isFavorite]
  );
  return (result.rowCount ?? 0) > 0;
}
```

---

### 新規 API: `PATCH /api/generations/[id]/tags`

**ファイル:** `src/app/api/generations/[id]/tags/route.ts`

```
PATCH /api/generations/[id]/tags
Body: { "tags": ["tag1", "tag2"] }
```

**レスポンス:**
```json
{ "data": { "tags": ["tag1", "tag2"] } }
```

**DB関数追加（`db.ts`）:**

```typescript
export async function updateGenerationTags(id: string, tags: string[]): Promise<boolean> {
  const result = await pool.query(
    "UPDATE generations SET tags = $2 WHERE id = $1",
    [id, tags]
  );
  return (result.rowCount ?? 0) > 0;
}
```

---

## フロントエンド設計

### コンポーネント構成

```
src/
├── app/
│   └── gallery/
│       ├── page.tsx               ← 既存。FR-01/FR-02の変更対象
│       └── [id]/
│           └── page.tsx           ← 新規。FR-03
├── components/
│   ├── GalleryGrid.tsx            ← 既存。FR-01/FR-04の変更対象
│   ├── GalleryListView.tsx        ← 新規。リスト表示コンポーネント
│   ├── GalleryCard.tsx            ← 新規。カードを独立コンポーネント化（ハートアイコン含む）
│   ├── ImageDetailModal.tsx       ← 既存。詳細ページリンクボタン追加
│   └── SimilarDesigns.tsx         ← 新規。類似デザイン表示
└── lib/
    ├── db.ts                      ← 既存。ListOptions拡張・新DB関数追加
    └── api.ts                     ← 既存。新API呼び出し関数追加
```

---

### FR-01: ビュー切替・サイズ切替

**`gallery/page.tsx` の変更点:**

```typescript
// 追加 state
const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
  typeof window !== "undefined"
    ? (localStorage.getItem("gallery-view-mode") as "grid" | "list") ?? "grid"
    : "grid"
);
const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">(() =>
  typeof window !== "undefined"
    ? (localStorage.getItem("gallery-grid-size") as "sm" | "md" | "lg") ?? "md"
    : "md"
);
```

**グリッドサイズのminmax値:**

| サイズ | minmax |
|--------|--------|
| sm | `minmax(120px, 1fr)` |
| md | `minmax(200px, 1fr)` （現状維持） |
| lg | `minmax(300px, 1fr)` |

**フィルターバーに追加するコントロール:**

```tsx
{/* ビュー切替 */}
<button data-testid="gallery-view-grid" onClick={() => setViewMode("grid")} aria-pressed={viewMode === "grid"}>
  グリッド
</button>
<button data-testid="gallery-view-list" onClick={() => setViewMode("list")} aria-pressed={viewMode === "list"}>
  リスト
</button>

{/* グリッドサイズ（グリッドモード時のみ表示） */}
{viewMode === "grid" && (
  <select data-testid="gallery-grid-size" value={gridSize} onChange={...}>
    <option value="sm">小</option>
    <option value="md">中</option>
    <option value="lg">大</option>
  </select>
)}
```

---

### FR-02: フィルタ強化

**`gallery/page.tsx` の追加 state:**

```typescript
const [workflowFilter, setWorkflowFilter] = useState("");
const [tagFilter, setTagFilter] = useState<string[]>([]);
const [statusFilter, setStatusFilter] = useState<"success" | "error" | "all">("success");
const [isFavoriteFilter, setIsFavoriteFilter] = useState(false);
```

**フィルターバー追加 UI:**

```tsx
{/* ワークフローフィルタ */}
<select data-testid="gallery-workflow-filter" value={workflowFilter} onChange={...}>
  <option value="">すべて</option>
  <option value="flux-gguf">Flux-schnell</option>
  <option value="sd15">SD1.5</option>
</select>

{/* お気に入りフィルタ */}
<label>
  <input type="checkbox" data-testid="gallery-favorite-filter" checked={isFavoriteFilter} onChange={...} />
  お気に入りのみ
</label>
```

タグフィルタ: テキスト入力 + Enter でタグを追加、×ボタンで削除する Chip UI。

---

### FR-03: 詳細ページ `gallery/[id]/page.tsx`

**Server Component として実装（SEO / OGP対応のため）:**

```typescript
// app/gallery/[id]/page.tsx
export default async function GalleryDetailPage({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/generations/${params.id}`, {
    cache: "no-store",
  });
  if (!res.ok) notFound();
  const { data } = await res.json();
  return <GalleryDetailClient generation={data.generation} similar={data.similar} />;
}
```

**`GalleryDetailClient` コンポーネント（Client Component）:**

- 上段: 画像（大きく表示、`object-contain`）
- 下段左: メタデータ一覧（dl/dt/dd）
  - プロンプト、ネガティブプロンプト、ワークフロー、サイズ、ステップ数、CFGスケール、シード値、生成時間、生成日時、ステータス
- 下段右: アクション（ダウンロード、再生成、ギャラリーに戻る）
- 下段: 類似デザイン（`SimilarDesigns` コンポーネント）

**`SimilarDesigns` コンポーネント:**

```tsx
// 6件をグリッド（minmax(150px, 1fr)）で表示
// 各カードはクリックで /gallery/[id] に遷移
```

**ギャラリーカード → 詳細ページリンク:**

```tsx
// GalleryCard.tsx に追加
<a
  href={`/gallery/${gen.id}`}
  data-testid={`gallery-card-detail-link-${gen.id}`}
  onClick={(e) => e.stopPropagation()}
  aria-label="詳細ページを開く"
>
  <ExternalLinkIcon />
</a>
```

---

### FR-04: お気に入り

**`GalleryCard.tsx` のハートアイコン:**

```tsx
const [isFav, setIsFav] = useState(gen.is_favorite);

const handleFavoriteToggle = async (e: React.MouseEvent) => {
  e.stopPropagation();
  const next = !isFav;
  setIsFav(next);  // 楽観的更新
  try {
    await toggleFavorite(gen.id, next);
  } catch {
    setIsFav(!next);  // ロールバック
  }
};

return (
  <button
    data-testid={`gallery-card-favorite-${gen.id}`}
    onClick={handleFavoriteToggle}
    aria-label={isFav ? "お気に入りを解除" : "お気に入りに追加"}
    aria-pressed={isFav}
  >
    {isFav ? "♥" : "♡"}
  </button>
);
```

---

## `lib/api.ts` 追加関数

```typescript
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

export async function getGeneration(id: string): Promise<{ generation: Generation; similar: Generation[] }> {
  const res = await fetch(`/api/generations/${id}`);
  if (!res.ok) throw new Error("generation not found");
  const { data } = await res.json();
  return data;
}
```

---

## `Generation` 型変更（`lib/api.ts`）

```typescript
export interface Generation {
  // ...existing fields...
  tags: string[];          // 追加
  is_favorite: boolean;    // 追加
}
```

---

## テスト方針

### ユニットテスト
- `db.ts`: `listGenerations` のtags/status/isFavoriteフィルタ（既存モックパターン踏襲）
- `updateGenerationFavorite` / `updateGenerationTags` 関数

### APIテスト（Playwright / msw）
- `GET /api/generations?workflow=flux-gguf&isFavorite=1`
- `PUT /api/generations/[id]/favorite` 正常系・異常系（404）
- `PATCH /api/generations/[id]/tags` 正常系・異常系
- `GET /api/generations/[id]` 正常系・404

### E2Eテスト（Playwright）
- ビュー切替（グリッド↔リスト）が動作する
- グリッドサイズ切替が動作する
- お気に入りトグルで `/gallery` フィルタが機能する
- `/gallery/[id]` ページが表示される
- 類似デザインカードをクリックすると別の詳細ページに遷移する

---

## 実装順序（推奨）

1. **DBマイグレーション** `migrations/002_portfolio.sql`
2. **`db.ts` 拡張**: 型追加・新関数追加・`listGenerations` 拡張
3. **API追加**: `GET /api/generations/[id]`、`PUT /api/generations/[id]/favorite`、`PATCH /api/generations/[id]/tags`、`GET /api/generations` 拡張
4. **フロントエンド FR-04**: `GalleryCard.tsx` 新規作成（ハートアイコン含む）
5. **フロントエンド FR-01**: `GalleryListView.tsx` 新規作成、`GalleryGrid.tsx` サイズ切替対応
6. **フロントエンド FR-02**: `gallery/page.tsx` フィルタ拡張
7. **フロントエンド FR-03**: `gallery/[id]/page.tsx` + `SimilarDesigns.tsx` 新規作成
8. **テスト実装**

---

## 依存関係・前提条件

- PostgreSQL 14+ （`GIN` インデックス、`TEXT[]` 型対応済み）
- Next.js 14 App Router（既存構成を維持）
- 追加パッケージなし（新規npm依存不要）
