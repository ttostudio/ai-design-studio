# AI Design Studio

ComfyUI を使った汎用デザイン生成ツール。プロンプトを入力するだけで、ブログサムネイル・SNS画像・アイコン・イラストなどを自動生成できます。

## 概要

- **プロンプト入力** → ComfyUI API 経由で画像生成
- **Flux.1-schnell / SD1.5** ワークフロー選択
- **リアルタイム進捗表示**（SSE）
- **ギャラリー**（生成履歴・検索・フィルター・お気に入り）
- **テンプレート**（ブログサムネイル・SNS・アイコン・イラスト）
- **PostgreSQL** による生成履歴保存

## 技術スタック

| カテゴリ | 使用技術 |
|---|---|
| フロントエンド | Next.js 16, React 19, TypeScript 5, Tailwind CSS 3 |
| バックエンド | Next.js App Router API Routes |
| データベース | PostgreSQL 16 |
| 画像生成 | ComfyUI API |
| テスト | Jest, Playwright |
| インフラ | Docker Compose, Caddy |

## セットアップ

### 前提条件

- Node.js 20以上
- Docker & Docker Compose
- ComfyUI が起動済み（デフォルト: `http://localhost:3300`）

### 環境変数

`.env.example` をコピーして `.env.local` を作成します:

```bash
cp .env.example .env.local
```

各変数の説明:

| 変数名 | 説明 | デフォルト |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql://designstudio:designstudio@localhost:5437/designstudio` |
| `COMFYUI_API_URL` | ComfyUI API の URL | `http://localhost:3300` |
| `NEXT_PUBLIC_API_BASE` | フロントエンドから見た API ベース URL | （空文字 = 同一オリジン） |
| `NODE_ENV` | 実行環境 | `development` |

### ローカル開発

```bash
# 依存関係インストール
npm install

# DB のみ Docker で起動
docker compose up -d db

# 開発サーバー起動（port 3700）
npm run dev
```

ブラウザで http://localhost:3700 を開いてください。

### ビルド

```bash
npm run build
npm run start
```

### テスト

```bash
# ユニットテスト（カバレッジ付き）
npm test

# E2E テスト（Playwright）
npx playwright test
```

## Docker でのデプロイ

```bash
# 全サービス起動（DB + App + Caddy）
docker compose up -d --build

# ログ確認
docker compose logs -f app
```

起動後、以下の URL でアクセスできます:

| URL | サービス |
|---|---|
| http://localhost:3800 | アプリ直接アクセス |
| http://localhost:3801 | Caddy 経由 |

## アーキテクチャ

```
┌─────────────────────────────────────────────┐
│  Caddy (port 3801)                          │
│  リバースプロキシ                             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Next.js App (port 3800)                    │
│  ├── /app         App Router ページ          │
│  ├── /api         API Routes                │
│  ├── /components  UIコンポーネント           │
│  ├── /hooks       カスタムフック             │
│  └── /lib         DB・ComfyUI クライアント   │
└──────┬───────────────────────┬──────────────┘
       │                       │
┌──────▼──────┐    ┌───────────▼──────────────┐
│ PostgreSQL  │    │ ComfyUI API              │
│ (port 5437) │    │ (host port 3300)         │
└─────────────┘    └──────────────────────────┘
```

### ディレクトリ構成

```
src/
├── app/
│   ├── api/          # API Routes（generate, generations, images, progress, templates）
│   ├── gallery/      # ギャラリー画面
│   ├── templates/    # テンプレート一覧画面
│   ├── layout.tsx    # ルートレイアウト
│   └── page.tsx      # メイン生成画面
├── components/       # UIコンポーネント
├── hooks/            # カスタムフック（useGeneration）
└── lib/              # DB・API・バリデーション・テンプレート定義
```

## ライセンス

MIT
