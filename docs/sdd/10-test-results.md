---
issue: "ttostudio/ttoClaw#22"
version: "2.0"
author-role: QA Engineer
gate: Gate-5
status: completed
---

# Gate 5 テスト結果

## テスト環境

- Node.js v25.6.1
- Jest 29.7 (ユニットテスト・結合テスト)
- Playwright 1.x (E2E テスト)
- PostgreSQL 16 (Docker: localhost:5437)
- OS: macOS darwin arm64
- アプリ URL: http://localhost:3700

---

## 1. ユニットテスト結果

| スイート | テスト数 | 結果 |
|---|---|---|
| PromptInput | 10 | 10 PASS |
| TemplateSelector | 8 | 8 PASS |
| WorkflowSelector | 6 | 6 PASS |
| ParamsPanel | 12 | 12 PASS |
| PreviewPanel | 10 | 10 PASS |
| GalleryGrid | 8 | 8 PASS |
| ImageDetailModal | 10 | 10 PASS |
| useGeneration | 12 | 12 PASS |
| validators | 14 | 14 PASS |
| templates lib | 10 | 10 PASS |
| **合計** | **100** | **100 PASS** |

実行コマンド: `npx jest --forceExit`

### カバレッジ

- Statements: 70%
- Branches: 92%
- Functions: 74%
- 閾値 60% 達成

---

## 2. 結合テスト結果（実 PostgreSQL 接続）

**接続先**: `postgresql://designstudio:designstudio@localhost:5437/designstudio`
**実行コマンド**: `npx jest --config=jest.integration.config.ts --forceExit --runInBand`

| テスト ID | 内容 | 結果 |
|---|---|---|
| IT-01-01 | POST /api/generate が DB にレコードを保存する | PASS |
| IT-01-02 | テンプレートメタデータ（ID・サイズ）が DB に保存される | PASS |
| IT-01-03 | 連続 5 件リクエストが全件 DB に保存される | PASS |
| IT-01-04 | バリデーションエラーは 400 かつ DB に保存しない | PASS |
| IT-02-01 | GET /api/generations が完了済み生成のみ返す | PASS |
| IT-02-02 | ページネーションが DB レベルで動作する | PASS |
| IT-02-03 | 検索クエリで DB の ILIKE 検索が動作する | PASS |
| IT-03-01 | GET /api/generations/:id が正しいレコードを返す | PASS |
| IT-03-02 | 存在しない ID で 404 を返す | PASS |
| IT-T01-01 | GET /api/templates が全テンプレートを返す | PASS |
| IT-T01-02 | テンプレートに必須フィールドが含まれる | PASS |
| IT-T01-03 | blog-thumbnail テンプレートの寸法が正しい | PASS |
| IT-T01-04 | 存在しない templateId で 404 を返す | PASS |
| IT-S01-01 | GET /api/status が有効なステータスオブジェクトを返す | PASS |
| IT-S01-02 | GET /api/status に connection フィールドが存在する | PASS |
| IT-S02-01 | SSE progress ストリームが text/event-stream で応答する | PASS |
| IT-S02-02 | エラーステータスの生成で SSE に error イベントが含まれる | PASS |
| IT-S03-01 | DELETE /api/generations/:id で DB からレコードが削除される | PASS |
| IT-S03-02 | 存在しない ID の DELETE で 404 を返す | PASS |
| IT-S04-01 | ComfyUI 停止時でも /api/generations は正常動作する | PASS |
| **合計** | | **20 / 20 PASS** |

---

## 3. E2E テスト結果（Playwright / Chromium）

**アプリ URL**: http://localhost:3700
**実行コマンド**: `npx playwright test e2e/ --reporter=list`

### generate.spec.ts — 生成ページ

| テスト ID | 内容 | 結果 |
|---|---|---|
| E2E-UI-01 | ホームページが正しく表示される | PASS |
| E2E-UI-02 | ナビゲーションバーが表示される | PASS |
| E2E-UI-03 | ComfyUI オフライン状態がステータスバッジに表示される | PASS |
| E2E-UI-04 | ステータスバーが表示される | PASS |
| E2E-UI-05 | プレビューパネルが idle 状態で表示される | PASS |
| E2E-T01 | テンプレートチップが表示される | PASS |
| E2E-T02 | ブログサムネイルテンプレート選択でサイズが自動設定される | PASS |
| E2E-T03 | アイコンテンプレート選択でサイズが 512x512 に設定される | PASS |
| E2E-T04 | テンプレート選択でプロンプトにプレフィックスが追加される | PASS |
| E2E-V01 | 空のプロンプトでは生成ボタンが無効 | PASS |
| E2E-V02 | プロンプト入力後も ComfyUI オフラインではボタンが無効 | PASS |
| E2E-V03 | プロンプト文字数カウンターが動作する | PASS |
| E2E-03-01 | ComfyUI 停止時にエラー UI が表示される（API インターセプト） | PASS |
| E2E-03-02 | ComfyUI 停止中でもギャラリーは閲覧可能 | PASS |
| E2E-01-01 | [SKIP] 生成フロー全体 prompt → generate → gallery | SKIP |

**SKIP 理由 (E2E-01-01)**: ComfyUI (localhost:3300) が停止中のため、画像生成完了まで
待機するテストは実行不可。ComfyUI 起動時に test.skip を解除すること（CR-Q04 準拠）。

### gallery.spec.ts — ギャラリーページ

| テスト ID | 内容 | 結果 |
|---|---|---|
| E2E-02-01 | ギャラリーページが正しく表示される | PASS |
| E2E-02-02 | 空のギャラリー状態でもエラーなく表示される | PASS |
| E2E-02-03 | ギャラリーアイテムが表示される（API インターセプト） | PASS |
| E2E-02-04 | フィルターバー要素が全て表示される | PASS |
| E2E-02-05 | 検索フィルターが UI に反映される | PASS |
| E2E-02-06 | テンプレートフィルターが動作する | PASS |
| E2E-02-07 | 並び替えセレクターが動作する | PASS |
| E2E-02-08 | アイテム詳細モーダルが開く（API インターセプト） | PASS |
| E2E-02-09 | 生成ページへのナビゲーション | PASS |
| E2E-02-10 | テンプレートページへのナビゲーション | PASS |

### templates.spec.ts — テンプレートページ

| テスト ID | 内容 | 結果 |
|---|---|---|
| E2E-TP-01 | テンプレートページが正しく表示される | PASS |
| E2E-TP-02 | 全テンプレートカードが表示される | PASS |
| E2E-TP-03 | ブログサムネイルテンプレートの情報が正しく表示される | PASS |
| E2E-TP-04 | テンプレート使用ボタンで生成ページに遷移する | PASS |
| E2E-TP-05 | テンプレート選択後に適切な設定が適用される | PASS |
| E2E-TP-06 | テンプレートページから生成ページへのナビゲーション | PASS |
| E2E-TP-07 | テンプレートページからギャラリーへのナビゲーション | PASS |
| E2E-TP-08 | イラストテンプレートの SD1.5 ワークフローバッジが表示される | PASS |
| E2E-TP-09 | テンプレートのプロンプトプレフィックスが表示される | PASS |

### E2E 合計

| | 件数 |
|---|---|
| PASS | 33 |
| FAIL | 0 |
| SKIP | 1 (ComfyUI 停止中 - CR-Q04 準拠で理由明記済み) |
| 合計 | 34 |

---

## 4. Gate 5 チェックリスト

| 確認項目 | 結果 |
|---------|------|
| 実 PostgreSQL に接続してテスト実行 | PASS |
| POST /api/generate で DB 書き込み確認 | PASS |
| GET /api/generations で DB 読み取り確認 | PASS |
| ComfyUI フォールバック（502）確認 | PASS |
| E2E: ページ表示・ナビゲーション全件 PASS | PASS |
| E2E: ComfyUI 停止時エラー UI 表示 PASS | PASS |
| E2E: テンプレート選択フロー PASS | PASS |
| ユニットテスト 100 件全 PASS | PASS |
| skip テストに理由明記（CR-Q04） | PASS |
| モックのみのテストが存在しない | PASS |

## 5. 総合判定

**結合テスト**: PASS (20 件通過 / 0 件失敗)
**E2E テスト**: PASS (33 件通過 / 0 件失敗 / 1 件 SKIP)
**ユニットテスト**: PASS (100 件通過)

**Gate 5: PASS**
