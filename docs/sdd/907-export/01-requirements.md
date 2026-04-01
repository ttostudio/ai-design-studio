# SDD #907 — エクスポート機能（PNG / メタデータJSON）

## 1. 概要

生成済み画像のダウンロード機能を強化し、以下を実現する。

- ファイル名の統一フォーマット化（テンプレート名 + タイムスタンプ）
- 解像度選択（1x 原寸 / 2x アップスケール）
- 生成パラメータのメタデータ JSON エクスポート
- 3 箇所（PreviewPanel / ImageDetailModal / GalleryDetailClient）の統一対応

---

## 2. 機能要件

### FR-1: ファイル名フォーマット

| # | 要件 |
|---|------|
| FR-1-1 | PNG ダウンロード時のファイル名を `{テンプレートラベル}_{YYYYMMdd-HHmmss}.png` にする |
| FR-1-2 | テンプレート未選択の場合は `ai-design_{YYYYMMdd-HHmmss}.png` にする |
| FR-1-3 | メタデータ JSON のファイル名も同じルールで `.json` 拡張子 |

### FR-2: 解像度選択

| # | 要件 |
|---|------|
| FR-2-1 | 1x ボタン: 原寸画像をそのままダウンロード |
| FR-2-2 | 2x ボタン: Canvas API で 2 倍に拡大してダウンロード。ファイル名末尾に `_2x` を付与 |
| FR-2-3 | デフォルトは 1x（ボタングループ表示） |

### FR-3: メタデータ JSON エクスポート

| # | 要件 |
|---|------|
| FR-3-1 | 以下フィールドを含む JSON をダウンロード可能にする: `id`, `prompt`, `negative_prompt`, `workflow`, `width`, `height`, `steps`, `cfg_scale`, `seed`, `template_id`, `created_at`, `execution_time`, `tags` |
| FR-3-2 | ImageDetailModal と GalleryDetailClient に「メタデータをダウンロード」ボタンを追加 |
| FR-3-3 | PreviewPanel では生成直後に params 情報から JSON 生成可能にする |

### FR-4: 対象コンポーネント

| コンポーネント | PNG DL | 解像度選択 | メタデータ JSON |
|---|---|---|---|
| PreviewPanel | 既存強化 | ○ | ○（params渡し） |
| ImageDetailModal | 既存強化 | ○ | ○（Generation渡し） |
| GalleryDetailClient | 既存強化 | ○ | ○（Generation渡し） |

---

## 3. 受け入れ条件

| AC | 条件 |
|----|------|
| AC-1 | PNG ダウンロード時、ファイル名が `{label}_{YYYYMMdd-HHmmss}.png` 形式になっている |
| AC-2 | 2x ダウンロードすると、元の解像度の 2 倍サイズの PNG が保存される |
| AC-3 | メタデータ JSON ダウンロードで prompt・seed・workflow 等が含まれる JSON ファイルが保存される |
| AC-4 | 既存のギャラリー・プレビュー機能が壊れていない（ビルドエラーなし） |
| AC-5 | UI テキストが全て日本語 |
| AC-6 | 3 箇所全てで一貫した UI・動作になっている |

---

## 4. スコープ外

- SVG / CSS エクスポート（画像はラスターのため実装不要）
- バックエンド変更（全てフロントエンドのみ）
- 画像アップロード・共有機能

---

## 5. ロールバック方針

- 本変更は共有ユーティリティ追加 + 既存コンポーネント修正のみ
- ロールバック: `git revert` で PR コミットを取り消し、元の `handleDownload` に戻る
- DB・API 変更なし。デプロイ後の即時ロールバック可能
