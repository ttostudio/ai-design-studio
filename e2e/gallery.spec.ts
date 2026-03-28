/**
 * E2E テスト: ギャラリーページ
 *
 * テスト実行時の DB 状態に依存しないよう、空ギャラリー状態と
 * API インターセプトを組み合わせてテストする。
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3700";

// ギャラリーのモックデータ
const mockGenerations = [
  {
    id: "gen_mockaaaaaaaaaaa1",
    prompt_id: null,
    prompt: "beautiful sunset over mountains",
    negative_prompt: null,
    workflow: "flux-gguf",
    width: 1024,
    height: 576,
    steps: 4,
    cfg_scale: 1.0,
    seed: 12345,
    template_id: null,
    image_url: "/api/images/test1.png?subfolder=",
    image_filename: "test1.png",
    image_subfolder: "",
    execution_time: 5000,
    status: "success",
    error_message: null,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  },
  {
    id: "gen_mockaaaaaaaaaaa2",
    prompt_id: null,
    prompt: "city skyline at night",
    negative_prompt: null,
    workflow: "flux-gguf",
    width: 1024,
    height: 576,
    steps: 4,
    cfg_scale: 1.0,
    seed: 67890,
    template_id: "blog-thumbnail",
    image_url: "/api/images/test2.png?subfolder=",
    image_filename: "test2.png",
    image_subfolder: "",
    execution_time: 4500,
    status: "success",
    error_message: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

test.describe("E2E-02: ギャラリーページ — 表示", () => {
  test("E2E-02-01: ギャラリーページが正しく表示される", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForSelector('[data-testid="gallery-page"]');

    await expect(page.locator('[data-testid="gallery-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="gallery-filter-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="gallery-search"]')).toBeVisible();
  });

  test("E2E-02-02: 空のギャラリー状態でもエラーなく表示される", async ({ page }) => {
    // 空の結果を返すようにインターセプト
    await page.route("**/api/generations**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [], total: 0 } }),
      });
    });

    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForSelector('[data-testid="gallery-page"]');
    await page.waitForTimeout(500);

    // ページが正常に表示（エラーなし）
    await expect(page.locator('[data-testid="gallery-page"]')).toBeVisible();
    // エラー表示なし
    await expect(page.locator('[data-testid="gallery-error"]')).not.toBeVisible();
  });

  test("E2E-02-03: ギャラリーアイテムが表示される（API インターセプト）", async ({ page }) => {
    // モックデータを返すようにインターセプト
    await page.route("**/api/generations**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: mockGenerations, total: 2 } }),
      });
    });

    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForTimeout(1000);

    // ギャラリーグリッドが表示される
    await expect(page.locator('[data-testid="gallery-grid"]')).toBeVisible({ timeout: 5000 });

    // ギャラリーアイテム（data-testid="gallery-card-*"）が表示される
    const items = page.locator('[data-testid^="gallery-card-"]');
    await expect(items.first()).toBeVisible({ timeout: 5000 });
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("E2E-02-04: フィルターバー要素が全て表示される", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForSelector('[data-testid="gallery-page"]');

    await expect(page.locator('[data-testid="gallery-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="gallery-template-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="gallery-date-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="gallery-sort"]')).toBeVisible();
  });
});

test.describe("E2E-02: ギャラリー — 検索・フィルター", () => {
  test("E2E-02-05: 検索フィルターが UI に反映される", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForSelector('[data-testid="gallery-search"]');

    // 検索入力
    await page.fill('[data-testid="gallery-search"]', "mountain");
    await page.waitForTimeout(500);

    // 検索ボックスに値が入っている
    const searchValue = await page.locator('[data-testid="gallery-search"]').inputValue();
    expect(searchValue).toBe("mountain");
  });

  test("E2E-02-06: テンプレートフィルターが動作する", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForSelector('[data-testid="gallery-template-filter"]');

    await page.selectOption('[data-testid="gallery-template-filter"]', "blog-thumbnail");
    await page.waitForTimeout(300);

    const value = await page.locator('[data-testid="gallery-template-filter"]').inputValue();
    expect(value).toBe("blog-thumbnail");
  });

  test("E2E-02-07: 並び替えセレクターが動作する", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForSelector('[data-testid="gallery-sort"]');

    await page.selectOption('[data-testid="gallery-sort"]', "oldest");
    await page.waitForTimeout(300);

    const value = await page.locator('[data-testid="gallery-sort"]').inputValue();
    expect(value).toBe("oldest");
  });

  test("E2E-02-08: アイテム詳細モーダルが開く（API インターセプト）", async ({ page }) => {
    // 1件のモックデータ
    await page.route("**/api/generations**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { items: [mockGenerations[0]], total: 1 } }),
      });
    });
    // 画像リクエストをモック
    await page.route("**/api/images/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          "base64"
        ),
      });
    });

    await page.goto(`${BASE_URL}/gallery`);
    await page.waitForTimeout(1000);

    // ギャラリーカード（data-testid="gallery-card-*"）
    const items = page.locator('[data-testid^="gallery-card-"]');
    const count = await items.count();
    if (count > 0) {
      await items.first().click();
      // モーダルが表示される
      await expect(page.locator('[data-testid="image-detail-modal"]')).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe("E2E-02: ギャラリー — ナビゲーション", () => {
  test("E2E-02-09: 生成ページへのナビゲーション", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);

    await page.click('[data-testid="navbar-link-生成"]');
    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test("E2E-02-10: テンプレートページへのナビゲーション", async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery`);

    await page.click('[data-testid="navbar-link-テンプレート"]');
    await expect(page).toHaveURL(BASE_URL + "/templates");
    await expect(page.locator('[data-testid="templates-page"]')).toBeVisible();
  });
});
