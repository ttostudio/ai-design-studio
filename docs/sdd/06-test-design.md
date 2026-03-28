---
issue: "ttostudio/ttoClaw#22"
version: "1.0"
author-role: QA Engineer
gate: Gate-4
status: draft
---

# テスト設計書 — AI Design Studio

## 1. テスト戦略

### 1.1 V字モデル

```
要件定義        ←→   受入テスト（E2E / Playwright）
  システム設計  ←→   結合テスト（実DB + ComfyUI API）
    詳細設計    ←→   ユニットテスト（Jest）
```

### 1.2 テストレベル定義

| レベル | 対象 | ツール | DB | ComfyUI |
|--------|------|--------|-----|---------|
| UT | 関数・クラス単位 | Jest + ts-jest | モック可 | モック |
| 結合テスト | API エンドポイント + 実DB | Jest + Supertest | **実PostgreSQL必須** | モック可 |
| E2E | ブラウザ操作 → DB 反映 | Playwright | **実PostgreSQL必須** | **実ComfyUI推奨** |

> **⚠️ Music Station 教訓**: モックのみの結合テストは Gate 5 不合格。
> 実DB接続テストが1件以上通過していること。

### 1.3 品質目標

| メトリクス | 目標値 |
|-----------|--------|
| UT カバレッジ（line） | ≥ 80% |
| UT カバレッジ（branch） | ≥ 70% |
| 結合テスト PASS 率 | 100% |
| E2E テスト PASS 率 | 100% |
| 生成キュー投入 p95 | < 500ms |

---

## 2. テスト環境

### 2.1 UT 環境

```
Node.js 20 + TypeScript
Jest 29 + ts-jest
実行: pnpm test
```

### 2.2 結合テスト環境

```
PostgreSQL 16（Docker Compose: ai-design-studio-db-test）
  - DB名: design_studio_test
  - Port: 5433（本番と分離）
ComfyUI API: モックサーバー（nock / msw）
実行: pnpm test:integration
```

### 2.3 E2E 環境

```
Next.js（本番ビルド or dev）: localhost:3700
PostgreSQL: ai-design-studio-db（Docker）
ComfyUI API: localhost:3300（実稼働推奨）またはモック
Playwright: chromium
実行: pnpm test:e2e
```

### 2.4 docker-compose.test.yml（結合テスト用DB）

```yaml
services:
  db-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: design_studio_test
      POSTGRES_USER: design_studio
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U design_studio"]
      interval: 5s
      timeout: 5s
      retries: 10
```

---

## 3. テストカテゴリ一覧

### 3.1 ユニットテスト（07-unit-test-spec.md 参照）

| カテゴリ | 件数目安 |
|---------|---------|
| API ルート（入力バリデーション） | 20件 |
| ComfyUI クライアント | 15件 |
| テンプレートサービス | 10件 |
| SSE プログレスハンドラー | 10件 |
| DB モデル / リポジトリ | 10件 |
| **合計** | **65件** |

### 3.2 結合テスト（08-integration-test-spec.md 参照）

| カテゴリ | 件数目安 |
|---------|---------|
| POST /api/generate（実DB） | 5件 |
| GET /api/progress/:id（実DB） | 5件 |
| GET /api/gallery（実DB） | 5件 |
| GET /api/templates（実DB） | 3件 |
| POST /api/favorites（実DB） | 3件 |
| ComfyUI フォールバック | 5件 |
| **合計** | **26件** |

### 3.3 E2E テスト（08-integration-test-spec.md 参照）

| シナリオ | 件数目安 |
|---------|---------|
| 画像生成フロー | 3件 |
| ギャラリー表示 | 2件 |
| テンプレート適用 | 2件 |
| ComfyUI 停止フォールバック | 2件 |
| **合計** | **9件** |

---

## 4. 特記事項

### 4.1 ComfyUI フォールバックテスト（必須）

NFR-003「ComfyUI 停止時のエラー表示」を担保するため、以下を全レベルで実施：

- **UT**: ComfyUI クライアントがエラーを throw した場合のレスポンス検証
- **結合テスト**: ComfyUI をモックで 503 返却させた時の API レスポンス
- **E2E**: ComfyUI が停止した状態でのブラウザ表示確認（エラー UI の表示）

### 4.2 SSE テストの注意点

SSE（Server-Sent Events）のテストは以下の方針：
- UT: SSE ストリームのフォーマット・イベント順序
- 結合テスト: `eventsource-parser` を使用した実際の SSE 受信確認
- E2E: ブラウザでの進捗バー更新確認

### 4.3 テストデータ管理

- 結合テスト・E2E は各テスト前に DB を初期化（truncate）
- フィクスチャは `tests/fixtures/` に集約
- 生成画像の実ファイルは不要（ComfyUI モック or スタブ画像を使用）

---

## 5. Gate 5 チェックリスト

| チェック項目 | 判定 |
|-------------|------|
| UT 全件 PASS | □ |
| UT カバレッジ ≥ 80%（line） | □ |
| 結合テスト 実DB接続で PASS | □ |
| E2E テスト全件 PASS | □ |
| ComfyUI フォールバックテスト実施 | □ |
| skip テストに理由明記（CR-Q04） | □ |
| テスト結果レポート添付 | □ |
