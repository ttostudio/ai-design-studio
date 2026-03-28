---
issue: "ttostudio/ttoClaw#22"
version: "1.0"
author-role: Director
gate: Gate-1
status: draft
---

# 要件定義書 — AI Design Studio: ComfyUI 汎用デザイン生成ツール

## 概要

既存の ComfyUI API（apps/comfyui, port 3300）を活用し、
Web ブラウザからプロンプトで画像を生成・管理できる汎用デザインツールを構築する。

## 背景

AI Company OS に ComfyUI REST API が稼働中（Flux.1-schnell + SD1.5 対応）。
AI Tech Blog サムネイル生成で実績があるが、専用 UI がない。
汎用的なデザイン生成 UI を構築してチーム全体で活用する。

## 機能要件

| ID | 要件 | 優先度 | 備考 |
|----|------|--------|------|
| FR-001 | プロンプト入力 → 画像生成（Flux/SD1.5 選択） | Must | POST /api/generate |
| FR-002 | リアルタイム生成進捗表示（SSE） | Must | GET /api/progress/:id |
| FR-003 | 生成画像のギャラリー表示 | Must | 履歴一覧 |
| FR-004 | テンプレート選択（ブログサムネイル、SNS画像、アイコン等） | Must | プリセットプロンプト + サイズ |
| FR-005 | 生成履歴の DB 保存・検索 | Must | PostgreSQL |
| FR-006 | 画像ダウンロード | Must | |
| FR-007 | ワークフロー選択（Flux-schnell / SD1.5） | Should | |
| FR-008 | ネガティブプロンプト（SD1.5 のみ） | Should | |
| FR-009 | 画像サイズ・ステップ数のカスタマイズ | Should | |
| FR-010 | お気に入り・タグ管理 | Could | |

## 非機能要件

| ID | カテゴリ | 要件 | 基準値 |
|----|----------|------|--------|
| NFR-001 | パフォーマンス | 生成キュー投入レスポンス | < 500ms |
| NFR-002 | UX | 進捗表示のリアルタイム性 | SSE 1秒以内 |
| NFR-003 | 互換性 | ComfyUI 停止時のエラー表示 | フォールバック UI |
| NFR-004 | セキュリティ | プロンプト長制限 | 1000文字以内 |

## スコープ

### In
- Next.js フロントエンド（生成UI、ギャラリー、テンプレート）
- PostgreSQL（生成履歴）
- ComfyUI API 連携（localhost:3300）
- Docker Compose

### Out
- ComfyUI 本体の修正
- ユーザー認証（tto 単独使用）
- 画像編集（生成のみ）
- LoRA / ControlNet（Phase 2）

## 技術設計

### アーキテクチャ
```
[AI Design Studio]
  Next.js (port 3700)
       ↓ HTTP
  ComfyUI API (port 3300, 既存)
       ↓ HTTP/WS
  ComfyUI Engine (port 8188)
```

### テンプレート例
| テンプレート | ワークフロー | サイズ | プロンプトプレフィックス |
|---|---|---|---|
| ブログサムネイル | flux-gguf | 1024x576 | "blog thumbnail, clean design, " |
| SNS投稿画像 | flux-gguf | 1024x1024 | "social media post, vibrant, " |
| アイコン | flux-gguf | 512x512 | "icon, minimalist, centered, " |
| イラスト | sd15 | 512x768 | "illustration, detailed, " |

## 受入基準

| AC-ID | 条件 | 確認方法 |
|-------|------|----------|
| AC-001 | プロンプトを入力して画像が生成される | E2E テスト（ComfyUI 稼働時） |
| AC-002 | 生成進捗がリアルタイムで表示される | 手動確認 |
| AC-003 | ギャラリーに生成履歴が表示される | E2E テスト |
| AC-004 | テンプレート選択でプリセットが適用される | E2E テスト |
| AC-005 | Docker Compose up で起動する | 手動確認 |
| AC-006 | ComfyUI 停止時にエラーメッセージが表示される | UT |
