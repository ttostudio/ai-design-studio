/**
 * E2E テスト: 生成ページ
 *
 * ComfyUI は停止中を前提とするため、実際の画像生成フロー（E2E-01-01）は
 * test.skip でスキップする。理由: ComfyUI (localhost:3300) が利用不可のため、
 * 生成完了まで待機するテストは実行できない。
 *
 * 代わりに以下をテストする:
 * - ページ表示・UI 要素の確認
 * - テンプレート選択時の自動設定
 * - ComfyUI 停止時のエラー UI 表示（API インターセプト）
 * - フォームバリデーション
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3700";

test.describe("生成ページ — UI 表示・ナビゲーション", () => {
  test("E2E-UI-01: ホームページが正しく表示される", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="home-page"]');

    // 主要 UI 要素が表示されている
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="prompt-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="generate-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="workflow-select"]')).toBeVisible();
  });

  test("E2E-UI-02: ナビゲーションバーが表示される", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toContainText("AI Design Studio");
  });

  test("E2E-UI-03: ComfyUI オフライン状態がステータスバッジに表示される", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="comfyui-status-badge"]');

    // ComfyUI は停止中なのでオフライン表示
    await expect(page.locator('[data-testid="comfyui-status-badge"]')).toContainText("オフライン");
  });

  test("E2E-UI-04: ステータスバーが表示される", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('[data-testid="status-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-bar"]')).toContainText("準備完了");
  });

  test("E2E-UI-05: プレビューパネルが idle 状態で表示される", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-idle"]')).toBeVisible();
  });
});

test.describe("テンプレート選択", () => {
  test("E2E-T01: テンプレートチップが表示される", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-chip-blog-thumbnail"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-chip-sns-post"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-chip-icon"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-chip-illustration"]')).toBeVisible();
  });

  test("E2E-T02: ブログサムネイルテンプレート選択でサイズが自動設定される", async ({ page }) => {
    await page.goto(BASE_URL);

    // テンプレートチップをクリック
    await page.click('[data-testid="template-chip-blog-thumbnail"]');
    await page.waitForTimeout(300);

    // サイズが自動設定される（select 要素）
    const widthValue = await page.locator('[data-testid="width-select"]').inputValue();
    const heightValue = await page.locator('[data-testid="height-select"]').inputValue();
    expect(widthValue).toBe("1024");
    expect(heightValue).toBe("576");

    // ワークフローが flux-gguf に設定
    const workflowValue = await page.locator('[data-testid="workflow-select"]').inputValue();
    expect(workflowValue).toBe("flux-gguf");
  });

  test("E2E-T03: アイコンテンプレート選択でサイズが 512x512 に設定される", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-testid="template-chip-icon"]');
    await page.waitForTimeout(300);

    const widthValue = await page.locator('[data-testid="width-select"]').inputValue();
    const heightValue = await page.locator('[data-testid="height-select"]').inputValue();
    expect(widthValue).toBe("512");
    expect(heightValue).toBe("512");
  });

  test("E2E-T04: テンプレート選択でプロンプトにプレフィックスが追加される", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-testid="template-chip-blog-thumbnail"]');
    await page.waitForTimeout(300);

    const promptValue = await page.locator('[data-testid="prompt-textarea"]').inputValue();
    expect(promptValue).toContain("blog thumbnail");
  });
});

test.describe("フォームバリデーション", () => {
  test("E2E-V01: 空のプロンプトでは生成ボタンが無効", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="generate-btn"]');

    // プロンプトが空の場合はボタンが disabled
    await expect(page.locator('[data-testid="generate-btn"]')).toBeDisabled();
  });

  test("E2E-V02: プロンプト入力後も ComfyUI オフラインではボタンが無効", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('[data-testid="prompt-textarea"]', "test prompt");
    await page.waitForTimeout(300);

    // ComfyUI がオフラインなのでボタンは disabled のまま
    await expect(page.locator('[data-testid="generate-btn"]')).toBeDisabled();
    const btnText = await page.locator('[data-testid="generate-btn"]').textContent();
    expect(btnText).toContain("オフライン");
  });

  test("E2E-V03: プロンプト文字数カウンターが動作する", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('[data-testid="prompt-textarea"]', "hello world");
    await page.waitForTimeout(100);

    const count = await page.locator('[data-testid="prompt-count"]').textContent();
    expect(count).toContain("11");
    expect(count).toContain("1000");
  });
});

test.describe("E2E-03: ComfyUI 停止フォールバック（必須）", () => {
  test("E2E-03-01: ComfyUI 停止時にエラー UI が表示される（API インターセプト）", async ({ page }) => {
    // API をインターセプトして ComfyUI 停止状態を模倣
    await page.route("**/api/generate", (route) => {
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "COMFYUI_UNAVAILABLE",
            message: "ComfyUI が利用できません。しばらくしてからお試しください。",
          },
        }),
      });
    });
    // status API も online を返すよう偽装（generate ボタンを有効にする）
    await page.route("**/api/status", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { available: true, connection: "online" } }),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="generate-btn"]');
    await page.waitForTimeout(500);

    // プロンプトを入力して生成ボタンをクリック
    await page.fill('[data-testid="prompt-textarea"]', "test prompt for fallback");
    await page.waitForTimeout(300);

    await page.click('[data-testid="generate-btn"]');

    // エラーメッセージが表示される
    await expect(page.locator('[data-testid="preview-error"]')).toBeVisible({ timeout: 10000 });
    const errorText = await page.locator('[data-testid="preview-error"]').textContent();
    expect(errorText).toBeTruthy();

    // 生成ボタンが再び有効になる（リトライ可能）
    await expect(page.locator('[data-testid="generate-btn"]')).not.toBeDisabled({ timeout: 5000 });
  });

  test("E2E-03-02: ComfyUI 停止中でもギャラリーは閲覧可能", async ({ page }) => {
    // 生成 API のみエラーにする（gallery は正常）
    await page.route("**/api/generate", (route) => {
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "COMFYUI_UNAVAILABLE", message: "ComfyUI unavailable" } }),
      });
    });

    // ギャラリーページに直接アクセス
    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForSelector('[data-testid="gallery-page"]', { timeout: 10000 });

    // ギャラリーコンテナが正常に表示される
    await expect(page.locator('[data-testid="gallery-page"]')).toBeVisible();

    // エラーは表示されない（生成API エラーはギャラリーに影響しない）
    await expect(page.locator('[data-testid="gallery-error"]')).not.toBeVisible();
  });

  // E2E-01-01: 実際の生成フロー（ComfyUI 停止中はスキップ）
  // 理由: ComfyUI (localhost:3300) が利用不可のため、画像生成完了まで待機するテストは
  //       実行できない。ComfyUI 起動時に SKIP を解除すること。
  test.skip("E2E-01-01: [SKIP: ComfyUI 停止中] 生成フロー全体 prompt → generate → gallery", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('[data-testid="prompt-textarea"]', "beautiful mountain landscape");
    await page.selectOption('[data-testid="workflow-select"]', "flux-gguf");
    await page.click('[data-testid="generate-btn"]');

    // 進捗表示
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    // 生成完了（最大120秒）
    await expect(page.locator('[data-testid="preview-image"]')).toBeVisible({ timeout: 120_000 });

    // ギャラリーに追加確認
    await page.goto(`${BASE_URL}/gallery`);
    await expect(page.locator('[data-testid="gallery-item"]').first()).toBeVisible();
  });
});
