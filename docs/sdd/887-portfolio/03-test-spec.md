# テスト仕様書 — #887 ポートフォリオギャラリー

## 概要

UI仕様書（02-ui-spec.md）に基づくテスト仕様。単体テスト（Jest/RTL）と E2E テスト（Playwright）の両方を含む。

---

## テスト種別マトリクス

| テスト ID | テスト名 | 種別 | 優先度 |
|---|---|---|---|
| TC-001 | グリッド/リスト切替 | E2E + Unit | 高 |
| TC-002 | フィルタ適用（デスクトップ） | E2E + Unit | 高 |
| TC-003 | フィルタ折りたたみ（モバイル） | E2E | 高 |
| TC-004 | お気に入りトグル（カード） | Unit + E2E | 高 |
| TC-005 | お気に入りトグル（詳細モーダル） | Unit + E2E | 高 |
| TC-006 | お気に入り永続化（localStorage）| Unit | 中 |
| TC-007 | 詳細モーダル表示 | E2E + Unit | 高 |
| TC-008 | レスポンシブレイアウト | E2E | 中 |
| TC-009 | 検索デバウンス | Unit | 中 |
| TC-010 | ビューモード永続化 | Unit | 低 |

---

## TC-001: グリッド/リスト切替テスト

### 概要
ビュー切替ボタンでグリッド表示とリスト表示が正しく切り替わること。

### 前提条件
- ギャラリーページに生成画像が1件以上表示されている

### Unit テスト（Jest/RTL）

**TC-001-U1: グリッドボタンがアクティブ状態で初期表示される**
```
Given: GalleryPage をレンダリングする
When: 初期表示
Then: data-testid="view-toggle-grid" の aria-pressed が "true"
      data-testid="view-toggle-list" の aria-pressed が "false"
      data-testid="gallery-grid" が存在する
```

**TC-001-U2: リストボタンをクリックするとリストビューに切り替わる**
```
Given: GalleryPage が初期表示（グリッドビュー）
When: data-testid="view-toggle-list" をクリック
Then: data-testid="gallery-list" が存在する
      data-testid="gallery-grid" が存在しない
      data-testid="view-toggle-list" の aria-pressed が "true"
```

**TC-001-U3: グリッドボタンをクリックするとグリッドビューに戻る**
```
Given: リストビュー表示中
When: data-testid="view-toggle-grid" をクリック
Then: data-testid="gallery-grid" が存在する
      data-testid="gallery-list" が存在しない
```

### E2E テスト（Playwright）

**TC-001-E1: ビュー切替の視覚確認**
```
1. /gallery に遷移
2. グリッドビューのスクリーンショット取得
3. data-testid="view-toggle-list" をクリック
4. リストビューのスクリーンショット取得
5. ギャラリーカードが横長の行として表示されていることを確認
6. data-testid="view-toggle-grid" をクリックしてグリッドに戻ることを確認
```

---

## TC-002: フィルタ適用テスト

### 概要
各フィルタドロップダウンが API リクエストに正しく反映されること。

### Unit テスト（Jest/RTL）

**TC-002-U1: ワークフローフィルタを変更するとフェッチが再実行される**
```
Given: listGenerations をモック
When: data-testid="gallery-workflow-filter" で "flux-gguf" を選択
Then: listGenerations が { workflow: "flux-gguf" } で呼ばれる
```

**TC-002-U2: テンプレートフィルタを変更するとフェッチが再実行される**
```
Given: listGenerations をモック
When: data-testid="gallery-template-filter" で "blog-thumbnail" を選択
Then: listGenerations が { templateId: "blog-thumbnail" } で呼ばれる
```

**TC-002-U3: タグフィルタを変更するとフェッチが再実行される**
```
Given: listGenerations をモック、APIがタグ一覧を返す
When: data-testid="gallery-tag-filter" でいずれかのタグを選択
Then: listGenerations が { tag: "<選択タグ>" } で呼ばれる
```

**TC-002-U4: 複数フィルタを組み合わせて適用できる**
```
Given: listGenerations をモック
When: テンプレート="blog-thumbnail"、日付="today" を選択
Then: listGenerations が { templateId: "blog-thumbnail", dateFilter: "today" } で呼ばれる
```

**TC-002-U5: フィルタをリセット（すべて）に戻すとフィルタなしでフェッチされる**
```
Given: テンプレートフィルタが "blog-thumbnail" 選択中
When: テンプレートフィルタを "すべて" に変更
Then: listGenerations が { templateId: undefined } で呼ばれる
```

### E2E テスト（Playwright）

**TC-002-E1: テンプレートフィルタ適用後に表示件数が変わる**
```
1. /gallery に遷移し初期件数を記録
2. data-testid="gallery-template-filter" で "ブログサムネイル" を選択
3. data-testid="gallery-loading" が非表示になるまで待機
4. 表示件数が初期件数以下であることを確認（フィルタが効いている）
```

---

## TC-003: フィルタ折りたたみテスト（モバイル）

### 概要
モバイル幅でフィルタドロワーが正しく折りたたまれ、展開できること。

### E2E テスト（Playwright）

**TC-003-E1: モバイル幅でフィルタドロワーが折りたたまれている**
```
1. ビューポートを 375×812 に設定
2. /gallery に遷移
3. data-testid="gallery-filter-drawer" の aria-expanded が "false" であることを確認
4. ワークフロー・テンプレート・タグ・日付ドロップダウンが非表示（不可視）であることを確認
```

**TC-003-E2: フィルタトグルボタンでドロワーが展開される**
```
1. ビューポートを 375×812 に設定
2. /gallery に遷移
3. data-testid="gallery-filter-toggle" をクリック
4. data-testid="gallery-filter-drawer" の aria-expanded が "true" であることを確認
5. ドロップダウン群が表示されることを確認
```

**TC-003-E3: デスクトップ幅でフィルタドロワーが常に表示される**
```
1. ビューポートを 1280×800 に設定
2. /gallery に遷移
3. data-testid="gallery-filter-toggle" が存在しない（md: hidden）ことを確認
4. ワークフロー・テンプレートドロップダウンが表示されていることを確認
```

---

## TC-004: お気に入りトグルテスト（カード内）

### 概要
ギャラリーカード内のハートボタンでお気に入り状態が切り替わること。

### Unit テスト（Jest/RTL）

**TC-004-U1: 初期表示でお気に入りボタンが非アクティブ状態**
```
Given: お気に入りに登録されていない生成画像のカード
When: レンダリング
Then: data-testid="gallery-card-favorite-{id}" の aria-pressed が "false"
      aria-label が "お気に入りに追加"
```

**TC-004-U2: お気に入りボタンをクリックするとアクティブ状態になる**
```
Given: 非アクティブのカード
When: data-testid="gallery-card-favorite-{id}" をクリック
Then: aria-pressed が "true"
      aria-label が "お気に入りから削除"
      ハートアイコンの色が var(--color-error) になる
```

**TC-004-U3: 再クリックで非アクティブに戻る**
```
Given: アクティブ（お気に入り済み）のカード
When: data-testid="gallery-card-favorite-{id}" をクリック
Then: aria-pressed が "false"
      aria-label が "お気に入りに追加"
```

**TC-004-U4: お気に入りクリックがカードのクリック（詳細表示）に伝播しない**
```
Given: onCardClick モック関数
When: data-testid="gallery-card-favorite-{id}" をクリック
Then: onCardClick が呼ばれない（stopPropagation が正しく動作）
```

### E2E テスト（Playwright）

**TC-004-E1: カードホバーでお気に入りボタンが表示される**
```
1. /gallery に遷移し生成画像が表示されるまで待機
2. 最初のカードにホバー
3. data-testid="gallery-card-favorite-{id}" が visible になることを確認
```

---

## TC-005: お気に入りトグルテスト（詳細モーダル）

### 概要
詳細モーダル内のハートボタンでお気に入り状態が切り替わり、カード側にも反映されること。

### Unit テスト（Jest/RTL）

**TC-005-U1: 詳細モーダルにお気に入りボタンが存在する**
```
Given: ImageDetailModal をレンダリング（お気に入り未登録の generation）
When: レンダリング
Then: data-testid="modal-favorite-btn" が存在する
      aria-pressed が "false"
```

**TC-005-U2: 詳細モーダルのお気に入りボタンをクリックするとアクティブになる**
```
Given: お気に入り未登録状態の ImageDetailModal
When: data-testid="modal-favorite-btn" をクリック
Then: aria-pressed が "true"
```

### E2E テスト（Playwright）

**TC-005-E1: モーダルでお気に入り登録するとカード側にも反映される**
```
1. /gallery に遷移
2. 最初のカードをクリック（詳細モーダルを開く）
3. data-testid="modal-favorite-btn" をクリック（お気に入り登録）
4. モーダルを閉じる（Escape キー）
5. 同カードの data-testid="gallery-card-favorite-{id}" の aria-pressed が "true" であることを確認
```

---

## TC-006: お気に入り永続化テスト

### 概要
お気に入り状態が localStorage に正しく保存・読み込みされること。

### Unit テスト（Jest/RTL）

**TC-006-U1: お気に入り登録時に localStorage に保存される**
```
Given: localStorage が空
When: toggleFavorite("gen-001") を実行
Then: localStorage.getItem("ai-design-studio:favorites") が '["gen-001"]' を含む
```

**TC-006-U2: お気に入り解除時に localStorage から削除される**
```
Given: localStorage に ["gen-001"] が保存されている
When: toggleFavorite("gen-001") を実行
Then: localStorage.getItem("ai-design-studio:favorites") が '[]'
```

**TC-006-U3: ページ再読み込み後もお気に入り状態が復元される**
```
Given: localStorage に ["gen-001", "gen-002"] が保存されている
When: useFavorites hook を初期化
Then: isFavorite("gen-001") が true
      isFavorite("gen-002") が true
      isFavorite("gen-003") が false
```

---

## TC-007: 詳細モーダル表示テスト

### 概要
カードクリックで詳細モーダルが開き、正しい情報が表示されること。

### Unit テスト（Jest/RTL）

**TC-007-U1: カードクリックで詳細モーダルが開く**
```
Given: GalleryPage に生成画像が存在する
When: gallery-card-{id} をクリック
Then: data-testid="image-detail-modal" が表示される
```

**TC-007-U2: モーダルに正しいメタデータが表示される**
```
Given: generation = { workflow: "flux-gguf", width: 1024, height: 576, steps: 4, seed: 12345, prompt: "test prompt" }
When: ImageDetailModal をレンダリング
Then: "Flux-schnell" が表示される（WORKFLOW_LABELS の変換）
      "1024 × 576" が表示される
      "4" が表示される（ステップ）
      "12345" が表示される（シード）
      "test prompt" が data-testid="modal-prompt" に表示される
```

**TC-007-U3: Escape キーでモーダルが閉じる**
```
Given: モーダルが開いている
When: Escape キーを押下
Then: onClose が呼ばれる
```

**TC-007-U4: オーバーレイクリックでモーダルが閉じる**
```
Given: モーダルが開いている
When: data-testid="image-detail-modal-overlay" をクリック（モーダル外側）
Then: onClose が呼ばれる
```

**TC-007-U5: 「プロンプトを再利用」ボタンがホームページに遷移する**
```
Given: generation の各パラメータが設定されている
When: data-testid="modal-reuse-btn" をクリック
Then: router.push が "/?prompt=...&workflow=..." の形式で呼ばれる
```

### E2E テスト（Playwright）

**TC-007-E1: スプリットビューで画像と詳細が横並び表示される（デスクトップ）**
```
1. ビューポートを 1280×800 に設定
2. /gallery に遷移し、カードをクリック
3. data-testid="image-detail-modal" が flex-row レイアウトであることを確認
4. 画像エリアと詳細エリアが横並びであることをスクリーンショットで確認
```

**TC-007-E2: スプリットビューが縦積みになる（モバイル）**
```
1. ビューポートを 375×812 に設定
2. /gallery に遷移し、カードをクリック
3. data-testid="image-detail-modal" が flex-col レイアウトであることを確認
```

---

## TC-008: レスポンシブレイアウトテスト

### 概要
各ブレークポイントでレイアウトが正しく切り替わること。

### E2E テスト（Playwright）

**TC-008-E1: モバイル幅でカード最小幅が160pxに変わる**
```
1. ビューポートを 375×812 に設定
2. /gallery に遷移
3. gallery-grid の gridTemplateColumns が minmax(160px, 1fr) であることを確認
```

**TC-008-E2: タブレット幅（640〜767px）でカード最小幅が180px**
```
1. ビューポートを 640×900 に設定
2. /gallery に遷移
3. gallery-grid の gridTemplateColumns が minmax(180px, 1fr) であることを確認
```

**TC-008-E3: デスクトップ幅でカード最小幅が200px**
```
1. ビューポートを 1280×800 に設定
2. /gallery に遷移
3. gallery-grid の gridTemplateColumns が minmax(200px, 1fr) であることを確認
```

**TC-008-E4: モバイルでナビゲーションがハンバーガーメニュー表示**
```
1. ビューポートを 375×812 に設定
2. /gallery に遷移
3. data-testid="navbar-hamburger" が visible であることを確認
4. data-testid="navbar-links" が非表示であることを確認
```

---

## TC-009: 検索デバウンステスト

### 概要
検索フィールドへの入力が 300ms デバウンス後に API リクエストに反映されること。

### Unit テスト（Jest/RTL）

**TC-009-U1: 入力直後に API リクエストが発火しない**
```
Given: jest.useFakeTimers()、listGenerations をモック
When: gallery-search に "test" を入力
Then: listGenerations がまだ呼ばれていない（300ms 経過前）
```

**TC-009-U2: 300ms 後に API リクエストが発火する**
```
Given: jest.useFakeTimers()、listGenerations をモック
When: gallery-search に "test" を入力し、jest.advanceTimersByTime(300) を実行
Then: listGenerations が { search: "test" } で呼ばれる
```

**TC-009-U3: 連続入力では最後の入力のみがトリガーされる**
```
Given: jest.useFakeTimers()、listGenerations をモック
When: "a" を入力 → 100ms後 "b" を追加入力 → 300ms経過
Then: listGenerations が { search: "ab" } で1回だけ呼ばれる
```

---

## TC-010: ビューモード永続化テスト

### Unit テスト（Jest/RTL）

**TC-010-U1: ビューモードが localStorage に保存される**
```
Given: localStorage が空
When: view-toggle-list をクリック
Then: localStorage.getItem("ai-design-studio:view-mode") が "list"
```

**TC-010-U2: ページ再読み込み後にビューモードが復元される**
```
Given: localStorage に "ai-design-studio:view-mode" = "list" が保存されている
When: GalleryPage をレンダリング
Then: data-testid="gallery-list" が表示される（グリッドではなくリスト）
```

---

## テストデータ

### モック Generation オブジェクト

```typescript
export const mockGeneration = {
  id: "gen-001",
  prompt: "A beautiful sunset over the ocean",
  negative_prompt: "blurry, low quality",
  workflow: "flux-gguf",
  template_id: "blog-thumbnail",
  width: 1024,
  height: 576,
  steps: 4,
  seed: 42,
  status: "completed",
  image_url: "/test-image.png",
  created_at: "2026-04-01T10:00:00Z",
};

export const mockGenerations = Array.from({ length: 5 }, (_, i) => ({
  ...mockGeneration,
  id: `gen-00${i + 1}`,
  created_at: new Date(Date.now() - i * 60000).toISOString(),
}));
```

---

## 合否基準

| 区分 | 基準 |
|---|---|
| Unit テスト | カバレッジ 80% 以上（新規追加コード対象） |
| E2E テスト | 全 TC がパス |
| レスポンシブ | 375px / 640px / 1280px の3サイズで全 TC がパス |
| アクセシビリティ | aria-pressed / aria-expanded / aria-label が全インタラクティブ要素に設定されている |
