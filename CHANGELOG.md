# Changelog

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
