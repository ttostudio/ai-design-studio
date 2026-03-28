# Gate 4: コードレビュー結果 — AI Design Studio

> レビュアー: Code Reviewer (独立エージェント)
> 対象: `src/` 全ファイル（API Routes, Pages, Components, Hooks, Lib）
> 参照SDD: 01-requirements.md, 04-external-design.md, 05-internal-design.md
> 日付: 2026-03-28

---

## 総合判定: CONDITIONAL PASS

軽微な指摘あり。セキュリティ上の重大問題なし。以下の指摘事項を修正後、テストフェーズへ移行可。

---

## 1. セキュリティチェック

### CR-S01: XSS 脆弱性 — ✅ PASS

- `dangerouslySetInnerHTML` / `innerHTML` の使用なし
- 全てのユーザー入力（prompt, negativePrompt）は JSX テキストレンダリングで表示
- `validators.ts:24` で制御文字を除去する `sanitizeText()` が適用済み
- コンポーネント内でユーザー入力を直接 DOM に挿入する箇所なし

### CR-S02: DOM 直接操作 — ✅ PASS

- `document.getElementById` / `document.querySelector` 等の直接 DOM 操作なし
- 全て React の state / ref パターンで実装
- `useGeneration.ts` の EventSource 管理は `useRef` で適切に管理

### CR-S03: SQL インジェクション — ✅ PASS

- `db.ts` の全クエリでパラメタライズドクエリ (`$1, $2, ...`) を使用
- `listGenerations()` での動的クエリ構築もパラメータインデックスで安全に構築
- `ILIKE` 検索 (`db.ts:159`) もパラメータ経由で安全

### CR-S04: パストラバーサル — ✅ PASS

- `validators.ts:133-138`: `validateFilename()` は `[a-zA-Z0-9_\-.]` のみ許可、`..` を拒否
- `validateSubfolder()` は `..`, `/`, `\\` を拒否
- `images/[filename]/route.ts:18-27`: 両バリデーションを API ルートで適用済み
- `encodeURIComponent` でファイル名をエンコードしてから upstream へ転送

### CR-S05: 入力検証 — ✅ PASS

- `validators.ts:28-131`: 全フィールドの型チェック・範囲チェック・サニタイズが SDD 05-internal-design.md の仕様通り
- prompt: 1-1000文字制限 ✅
- negativePrompt: 0-500文字制限 ✅
- workflow: allowlist (`flux-gguf`, `sd15`) ✅
- width/height: 64-2048, 8の倍数 ✅
- steps: 1-150 整数 ✅
- cfgScale: 1.0-30.0 ✅
- seed: -1 〜 2147483647 整数 ✅
- templateId: `/^[a-z0-9\-]{1,64}$/` ✅

### CR-S06: エラーメッセージの情報漏洩 — ✅ PASS

- 全 API ルートで内部エラー詳細はクライアントに返さず、`console.error` でサーバーログのみ
- エラーレスポンスは日本語のユーザー向けメッセージのみ
- ComfyUI のステータスコードは `comfyui-client.ts:46` で抽象化

### CR-S07: リソース管理 — ✅ PASS

- SSE ストリーム: `progress/[promptId]/route.ts:36` で 330秒タイムアウト設定
- ComfyUI API 呼び出し: `comfyui-client.ts:42` で 310秒タイムアウト
- 画像プロキシ: `images/[filename]/route.ts:35` で 15秒タイムアウト
- DB コネクションプール: `db.ts:3-9` で max 5, idle 30秒, 接続 5秒タイムアウト
- クライアント abort 検出: `progress/[promptId]/route.ts:30-33` で `req.signal` を監視

---

## 2. コード品質チェック

### CR-Q01: DRY 違反 — ⚠️ WARNING (軽微)

**指摘箇所:** ID バリデーション正規表現の重複

- `generations/[id]/route.ts:11`: `/^gen_[A-Za-z0-9_-]{16}$/`
- `generations/[id]/route.ts:27`: 同一正規表現が GET と DELETE で重複

**推奨:** 定数化して共有するか、`validators.ts` に `validateGenerationId()` を追加。
**重大度:** Low — 同一ファイル内の2箇所のみ。

### CR-Q02: SDD 仕様乖離 — ⚠️ WARNING (2件)

**乖離 1: `total` フィールドの不正確さ**
- SDD 04-external-design.md: `GET /api/generations` は `total` を返す仕様
- 実装 (`generations/route.ts:15`): `total: items.length` としており、フィルタ後の取得件数を返している
- 本来の `total` は COUNT クエリで全件数を取得すべき（ページネーション用）
- **影響:** ギャラリーの「もっと読み込む」が `items.length === PAGE_SIZE` で判定しているため実用上は動作するが、SDD仕様との乖離あり

**乖離 2: `GET /api/generations/[id]` の ID 形式**
- SDD 05-internal-design.md: ID は `nanoid(16)` で生成（プレフィックスなし記載）
- 実装: `gen_` プレフィックス付き (`gen_${nanoid(16)}`) でバリデーションも `gen_` 必須
- **影響:** 実装側の方が堅牢だが、SDD 更新が必要

### CR-Q03: テストカバレッジ — ⚠️ WARNING

- テストファイルの存在を確認できなかった（`src/` 内に `*.test.ts` / `*.spec.ts` なし）
- SDD 05-internal-design.md で記載のユニットテスト対象（validators, templates, comfyui-client, db）のテストが未確認
- **推奨:** Gate 5 でテスト実行前に、テストファイルの存在とカバレッジ設定を確認すること

### CR-Q05: 型安全性 — ✅ GOOD

- `validators.ts` の Result 型パターンが適切
- `db.ts` の `GenerationRow`, `InsertGenerationData` 等のインターフェース定義が明確
- `api.ts` のクライアント側型定義が API レスポンスと整合
- `as` キャストは最小限（`validators.ts` の `Record<string, unknown>` からの取り出しのみ）
- non-null assertion (`!`) の使用なし

### CR-Q06: 命名・構成 — ✅ GOOD

- ディレクトリ構造が SDD 05-internal-design.md に準拠
- 日本語 UI ラベルが一貫
- コンポーネント分割が適切（単一責任原則に従う）
- `data-testid` が全コンポーネントに設定済み

---

## 3. パフォーマンスチェック

### N+1 クエリ — ✅ PASS

- `listGenerations()` は単一クエリで取得
- 個別取得も単一 `SELECT` のみ

### SSE メモリリーク — ✅ PASS

- `progress/[promptId]/route.ts`: クライアント切断時に `req.signal` の abort イベントで `closed = true` を設定し、ループを終了
- `useGeneration.ts:33-35`: `useEffect` cleanup で `closeStream()` を呼び出し、EventSource をクローズ
- `useGeneration.ts:92-101`: `es.onerror` で自動クローズ

### 画像プロキシ — ⚠️ INFO

- `images/[filename]/route.ts:40`: `upstream.arrayBuffer()` で全バイトをメモリに読み込み
- 大容量画像の場合にメモリ使用量が増加する可能性あり
- **現状:** ComfyUI の生成画像は通常数 MB 以下のため実用上問題なし
- **将来検討:** ストリーミングプロキシへの変更

---

## 4. プロセスチェック

### CR-P01: CHANGELOG.md — ⚠️ 未確認

- CHANGELOG.md の存在・更新状況は本レビュースコープ外（PR 単位で確認）

### CR-P02: デバッグコード残存 — ✅ PASS

- `console.log` の使用は `console.error` のみ（エラーログ用途として適切）
  - `generate/route.ts:117`: DB エラーログ
  - `generations/route.ts:14`: リスト取得エラーログ
  - `generations/[id]/route.ts:17,33`: 個別操作エラーログ
- TODO コメントなし
- デバッグ用コードの残存なし

---

## 5. 指摘事項サマリ

| # | カテゴリ | 重大度 | 内容 | ファイル |
|---|---------|--------|------|---------|
| 1 | CR-Q01 | Low | ID バリデーション正規表現の重複 | `generations/[id]/route.ts` |
| 2 | CR-Q02 | Medium | `total` フィールドが実件数（COUNT クエリ未使用） | `generations/route.ts:15` |
| 3 | CR-Q02 | Low | SDD に `gen_` プレフィックスの記載なし（SDD更新推奨） | `generate/route.ts:88` |
| 4 | CR-Q03 | Medium | テストファイル未確認（Gate 5 で要確認） | — |
| 5 | Info | Low | 画像プロキシが全バイトメモリ読み込み | `images/[filename]/route.ts:40` |

---

## 6. 良い実装パターン（評価ポイント）

1. **バリデーション層の分離**: `validators.ts` に全入力検証を集約。API ルートはバリデーション結果を受けるだけの薄い実装
2. **Fire-and-forget パターン**: `generate/route.ts:125` で `void backgroundGenerate()` として即座にレスポンスを返す設計。UX要件（<500ms応答）を満たす
3. **SSE の堅牢な実装**: タイムアウト、クライアント切断検出、近似プログレス表示を適切に実装
4. **セキュリティ多層防御**: 入力サニタイズ → バリデーション → パラメタライズドクエリ → パストラバーサル防止の4層
5. **テスタビリティ**: 全コンポーネントに `data-testid` 属性、モジュール分割による単体テスト容易性

---

## 7. Gate 4 判定

| 項目 | 判定 |
|------|------|
| セキュリティ | ✅ PASS（重大脆弱性なし） |
| コード品質 | ⚠️ CONDITIONAL（軽微な乖離・重複あり） |
| パフォーマンス | ✅ PASS |
| プロセス | ✅ PASS |
| **総合** | **CONDITIONAL PASS** |

### 移行条件

テストフェーズ（Gate 5）へ移行可。以下は修正推奨だが blocking ではない:

1. **推奨修正（Gate 5 前）**: `generations/route.ts` の `total` を COUNT クエリに変更
2. **推奨修正（任意）**: ID バリデーション正規表現の共通化
3. **SDD 更新**: `gen_` プレフィックスの仕様を 05-internal-design.md に反映
4. **Gate 5 確認事項**: テストファイルの存在とカバレッジ設定の確認
