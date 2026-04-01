# SDD #899 — AI Design Studio テンプレートプリセット追加（Web/Mobile/LP）

## 1. 概要

AI Design Studio の画像生成テンプレートに、Web アプリ・モバイルアプリ・ランディングページ向けの 9 種類のプリセットを追加する。

## 2. 要件定義

### 2.1 機能要件

| # | 要件 |
|---|------|
| FR-01 | Web アプリ用テンプレート 3 種（ダッシュボード・設定・一覧）を追加する |
| FR-02 | モバイルアプリ用テンプレート 3 種（ホーム・プロフィール・チャット）を追加する |
| FR-03 | ランディングページ用テンプレート 3 種（Hero・Feature・CTA）を追加する |
| FR-04 | 各テンプレートは既存の Template インターフェースに準拠する |
| FR-05 | promptPrefix は AI 画像生成に最適化した英語プロンプトとする |

### 2.2 受け入れ条件

| # | 条件 |
|---|------|
| AC-01 | `TEMPLATES` 配列の要素数が 6 → 15 に増加していること |
| AC-02 | `npm run build` がエラーなしで完了すること |
| AC-03 | 各テンプレートの `id` がユニークであること |
| AC-04 | Web 用テンプレートの width=1440, height=900 であること（lp-cta のみ height=600） |
| AC-05 | Mobile 用テンプレートの width=390, height=844 であること |
| AC-06 | 全テンプレートの `workflow` が "flux-gguf" であること |
| AC-07 | 全テンプレートに日本語の `name` と `description` が設定されていること |

## 3. 設計

### 3.1 追加テンプレート一覧

| id | name | width | height | steps | cfgScale |
|----|------|-------|--------|-------|----------|
| web-dashboard | Webダッシュボード | 1440 | 900 | 4 | 1.0 |
| web-settings | Web設定画面 | 1440 | 900 | 4 | 1.0 |
| web-list | Web一覧画面 | 1440 | 900 | 4 | 1.0 |
| mobile-home | モバイルホーム | 390 | 844 | 4 | 1.0 |
| mobile-profile | モバイルプロフィール | 390 | 844 | 4 | 1.0 |
| mobile-chat | モバイルチャット | 390 | 844 | 4 | 1.0 |
| lp-hero | LPヒーローセクション | 1440 | 900 | 4 | 1.0 |
| lp-feature | LP機能紹介セクション | 1440 | 900 | 4 | 1.0 |
| lp-cta | LPCTAセクション | 1440 | 600 | 4 | 1.0 |

### 3.2 変更ファイル

- `src/lib/templates.ts` — TEMPLATES 配列に 9 テンプレートを追記

### 3.3 ロールバック方針

追加のみで既存テンプレートを変更しないため、PR リバートで即時ロールバック可能。

## 4. テスト計画

- `npm run build` 成功確認
- TypeScript 型チェック通過確認（`tsc --noEmit`）
- TEMPLATES 配列要素数の確認

## 5. 担当

| ロール | 担当 |
|--------|------|
| Director | director |
| Backend Engineer | backend-engineer |
| Code Reviewer | code-reviewer |
| QMO | qmo |
