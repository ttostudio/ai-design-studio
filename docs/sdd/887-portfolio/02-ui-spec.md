# UI/UX 仕様書 — #887 ポートフォリオギャラリー

## 概要

AI Design Studio のギャラリーページに以下の機能を追加する。

- ビュー切替（グリッド / リスト）
- フィルタバー強化（ワークフロー・テンプレート・タグ + 検索）
- 詳細モーダルのスプリットビュー改善
- お気に入りボタン（ハートアイコン）
- モバイルでフィルタ折りたたみ

---

## 1. デザイントークン（既存コードとの整合）

既存の `src/app/globals.css` および `tailwind.config.ts` を参照する。追加・変更なし。

| トークン名 | 値 | 用途 |
|---|---|---|
| `--color-bg-primary` | `#0f0f11` | ページ背景 |
| `--color-bg-surface` | `#1a1a1f` | カード・モーダル背景 |
| `--color-bg-elevated` | `#252529` | 入力・ドロップダウン背景 |
| `--color-border` | `#2e2e35` | ボーダー |
| `--color-text-primary` | `#f0f0f2` | 主テキスト |
| `--color-text-secondary` | `#9090a0` | 補助テキスト・ラベル |
| `--color-text-disabled` | `#50505a` | 無効状態 |
| `--color-accent` | `#7c6af7` | アクティブ状態・CTA |
| `--color-accent-hover` | `#9080ff` | ホバー状態 |
| `--color-accent-muted` | `#2e2a5a` | アクセントバッジ背景 |
| `--color-error` | `#e05252` | エラー・ハート（アクティブ）|
| `--radius-sm` | `6px` | 入力・ボタン角丸 |
| `--radius-md` | `10px` | カード角丸 |
| `--shadow-card` | `0 2px 12px rgba(0,0,0,0.4)` | カードホバーシャドウ |

**ブレークポイント（Tailwind デフォルト）:**

| 名前 | 値 | 用途 |
|---|---|---|
| `md` | `768px` | デスクトップ切替、モーダルレイアウト切替 |
| `sm` | `640px` | フィルタバー折りたたみ |

---

## 2. ギャラリーページ構成

```
GalleryPage
├── PageHeader（タイトル + ビュー切替ボタン）
├── FilterBar（フィルタ + 検索）
│   ├── [モバイル] FilterToggleButton → FilterDrawer（折りたたみ）
│   └── [デスクトップ] フィルタ項目をインライン表示
├── GalleryGrid（グリッドビュー）or GalleryList（リストビュー）
│   └── GalleryCard × N（お気に入りボタン付き）
├── LoadMoreButton
└── ImageDetailModal（スプリットビュー）
    ├── 左ペイン: 画像表示
    └── 右ペイン: メタデータ + お気に入りボタン + アクション
```

---

## 3. ビュー切替ボタン

### 配置
- ページヘッダー右端に配置（タイトル「ギャラリー」と同一行）
- `data-testid="view-toggle-grid"` / `data-testid="view-toggle-list"`

### 外観
- アイコンボタン 2 個（グリッド / リスト）、サイズ `32×32px`
- アクティブ状態: `background-color: var(--color-accent-muted)` + `color: var(--color-accent)`
- 非アクティブ状態: `background-color: transparent` + `color: var(--color-text-secondary)`
- `border-radius: var(--radius-sm)`、間隔 `4px`

### アイコン仕様
- グリッドアイコン: 2×2 の正方形マスを表すSVG（16×16px）
- リストアイコン: 3本の横線を表すSVG（16×16px）

### 状態管理
- デフォルト: グリッドビュー
- 状態は `localStorage` に `ai-design-studio:view-mode` として永続化

---

## 4. フィルタバー

### デスクトップ（md以上: ≥768px）

```
[ 検索フィールド（flex-1）] [ワークフロー▼] [テンプレート▼] [タグ▼] [日付▼] [並び替え▼]
```

- `display: flex; flex-wrap: wrap; gap: 12px; align-items: center`
- `data-testid="gallery-filter-bar"`

### モバイル（md未満: <768px）

```
[ 検索フィールド（全幅）]
[ フィルターを絞り込む ▼ ]（タップで展開）
  ↳ 展開時: [ワークフロー▼] [テンプレート▼] [タグ▼] [日付▼] [並び替え▼] を縦積み
```

- `data-testid="gallery-filter-toggle"` — 折りたたみボタン
- `data-testid="gallery-filter-drawer"` — 展開エリア（`aria-expanded` 制御）
- 展開アニメーション: `max-height` トランジション 150ms

### フィルタ項目

| フィールド | data-testid | 選択肢 |
|---|---|---|
| 検索 | `gallery-search` | フリーテキスト |
| ワークフロー | `gallery-workflow-filter` | すべて / Flux-schnell / SD1.5 |
| テンプレート | `gallery-template-filter` | すべて / ブログサムネイル / SNS投稿画像 / アイコン / イラスト / カスタム |
| タグ | `gallery-tag-filter` | すべて（動的: APIから取得） |
| 日付 | `gallery-date-filter` | すべて / 今日 / 今週 / 今月 |
| 並び替え | `gallery-sort` | 新しい順 / 古い順 |

### フィルタコントロール スタイル
```css
background-color: var(--color-bg-elevated);
color: var(--color-text-primary);
border: 1px solid var(--color-border);
border-radius: var(--radius-sm);
padding: 6px 10px;
font-size: 13px;
```

---

## 5. ギャラリーカード（グリッドビュー）

### レイアウト
- グリッド: `repeat(auto-fill, minmax(200px, 1fr))` 、`gap: 16px`
- `data-testid="gallery-grid"`

### カード構成
```
┌──────────────────────┐
│ [画像エリア]          │  ← アスペクト比維持
│                    ♡ │  ← お気に入りボタン（右上オーバーレイ）
├──────────────────────┤
│ [テンプレートバッジ]   │
│ [プロンプトテキスト 2行] │
│ [生成日時]            │
└──────────────────────┘
```

### お気に入りボタン（カード内）
- 画像エリア右上に絶対配置、`position: absolute; top: 8px; right: 8px`
- サイズ: `28×28px`、`border-radius: 50%`
- 通常状態: `background-color: rgba(0,0,0,0.5); color: var(--color-text-secondary)`
- アクティブ（お気に入り済み）: `color: var(--color-error)` + ハート塗り潰し
- `data-testid="gallery-card-favorite-{id}"`
- `aria-label`: 「お気に入りに追加」/「お気に入りから削除」
- カードホバー時のみ表示（CSS: `.card:hover .favorite-btn` visibility）

### ホバー状態
- `transform: translateY(-2px)`
- `box-shadow: var(--shadow-card)`
- トランジション: 150ms

---

## 6. ギャラリーカード（リストビュー）

### レイアウト
- `display: flex; flex-direction: column; gap: 8px`
- `data-testid="gallery-list"`

### 各行構成
```
[ サムネイル 80×60px ] [ テンプレートバッジ + プロンプト + 日時 ] [ ♡ ] [ ワークフロー ]
```

- サムネイル: `width: 80px; height: 60px; object-fit: cover; border-radius: var(--radius-sm)`
- 行: `display: flex; align-items: center; gap: 12px; padding: 8px 12px`
- 背景: `var(--color-bg-surface)`, ボーダー: `1px solid var(--color-border)`
- `border-radius: var(--radius-md)`
- `data-testid="gallery-list-item-{id}"`

---

## 7. 詳細モーダル（スプリットビュー）

既存実装（`ImageDetailModal.tsx`）を改善する。

### レイアウト
- モバイル: 縦積み（`flex-direction: column`）
- デスクトップ（md以上）: 横並び（`flex-direction: row`）
- 左ペイン: `flex: 1`、画像を `object-contain` で表示
- 右ペイン: `width: 288px`（既存は `w-72 = 288px`、変更なし）

### お気に入りボタン（詳細ページ）
- 右ペインの「生成詳細」タイトル横（右端）に配置
- サイズ: `32×32px`
- 通常: `color: var(--color-text-secondary)`
- アクティブ: `color: var(--color-error)` + ハート塗り潰し
- `data-testid="modal-favorite-btn"`

### アクション順序（右ペイン下部）
1. お気に入りボタン（タイトル横）
2. 「プロンプトを再利用」 — アクセント色 CTA
3. 「ダウンロード」 — セカンダリボタン
4. 生成日時テキスト

---

## 8. お気に入り機能

### データ永続化
- `localStorage` の `ai-design-studio:favorites` キーに JSON 配列（生成 ID のリスト）を保存
- APIへの永続化は今サイクルでは対象外

### 状態
- グローバル状態（React Context または useLocalStorage hook）で管理
- `isFavorite(id: string): boolean`
- `toggleFavorite(id: string): void`

---

## 9. レスポンシブ仕様

| ブレークポイント | ビュー | フィルタ | カード最小幅 |
|---|---|---|---|
| `< 640px` | グリッド/リスト切替可 | 折りたたみ | `minmax(160px, 1fr)` |
| `640px〜767px` | グリッド/リスト切替可 | 折りたたみ | `minmax(180px, 1fr)` |
| `≥768px` | グリッド/リスト切替可 | インライン | `minmax(200px, 1fr)` |

---

## 10. アクセシビリティ

- ビュー切替ボタンに `aria-pressed` 属性
- フィルタドロワーに `aria-expanded` 属性
- お気に入りボタンに `aria-pressed` + `aria-label`
- キーボード操作: Tab でフォーカス可能、Enter/Space でアクション実行
- フォーカスリング: `outline: 2px solid var(--color-accent)` （globals.css の既存定義を使用）
