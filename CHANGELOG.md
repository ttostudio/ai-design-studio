# Changelog

## v0.2.0 (2026-04-04)

### Changed
- Next.js 14 → 16.2.2 にアップグレード
- React 18 → 19.2.4 にアップグレード
- `@types/react` / `@types/react-dom` を React 19 対応版に更新
- `eslint-config-next` を 16.x に更新
- `tsconfig.json` を Next.js 16 推奨設定に自動更新（`target: ES2017`, `jsx: react-jsx`）

### Added
- README.md（日本語）：プロジェクト概要・セットアップ・アーキテクチャ図を含む
- `.env.example` に `NEXT_PUBLIC_API_BASE` を追記

## v0.1.0 (2026-03-28)

### 初回リリース
- プロンプト入力 → ComfyUI API 経由で画像生成
- Flux.1-schnell / SD1.5 ワークフロー選択
- リアルタイム生成進捗表示（SSE）
- ギャラリー（生成履歴、検索、フィルター）
- テンプレート（ブログサムネイル、SNS、アイコン、イラスト）
- PostgreSQL 生成履歴保存
- ダークテーマ UI
- Docker Compose デプロイ（port 3700）
- 100 ユニットテスト、カバレッジ 70%

## [Unreleased]

### Added
- フロントエンド実装（Next.js 14 + Tailwind CSS + TypeScript）
  - メイン生成画面（左右2ペインレイアウト、SSE進捗表示）
  - ギャラリー画面（グリッド表示、検索・フィルター・詳細モーダル）
  - テンプレート一覧画面
  - ナビゲーションバー（ComfyUI接続ステータス、レスポンシブ対応）
  - コンポーネント: PromptInput, TemplateSelector, WorkflowSelector, ParamsPanel, PreviewPanel, ProgressBar, GalleryGrid, ImageDetailModal
  - カスタムフック: useGeneration（SSE接続・生成状態管理）
  - APIクライアント: src/lib/api.ts
  - バリデーション: src/lib/validators.ts
  - テンプレート定義: src/lib/templates.ts
  - ユニットテスト（validators, templates, 全コンポーネント, useGeneration hook）
  - Tailwind CSS ダークテーマ（デザイントークン準拠）
  - レスポンシブ対応（モバイル・タブレット・デスクトップ）
