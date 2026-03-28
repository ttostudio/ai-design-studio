/**
 * E2E テスト: テンプレートページ
 *
 * テンプレート一覧の表示・選択フロー・ナビゲーションを検証する。
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3700";

test.describe("E2E-TP: テンプレートページ", () => {
  test("E2E-TP-01: テンプレートページが正しく表示される", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForSelector('[data-testid="templates-page"]');

    await expect(page.locator('[data-testid="templates-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="templates-grid"]')).toBeVisible();
  });

  test("E2E-TP-02: 全テンプレートカードが表示される", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForSelector('[data-testid="templates-grid"]');

    // 4 種類のテンプレートが表示される
    await expect(page.locator('[data-testid="template-card-blog-thumbnail"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-card-sns-post"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-card-icon"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-card-illustration"]')).toBeVisible();
  });

  test("E2E-TP-03: ブログサムネイルテンプレートの情報が正しく表示される", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForSelector('[data-testid="template-card-blog-thumbnail"]');

    const card = page.locator('[data-testid="template-card-blog-thumbnail"]');
    await expect(card.locator('[data-testid="template-name-blog-thumbnail"]')).toContainText("ブログサムネイル");
    await expect(card.locator('[data-testid="template-size-blog-thumbnail"]')).toContainText("1024");
    await expect(card.locator('[data-testid="template-size-blog-thumbnail"]')).toContainText("576");
    await expect(card.locator('[data-testid="template-workflow-badge-blog-thumbnail"]')).toContainText("Flux-schnell");
  });

  test("E2E-TP-04: テンプレート使用ボタンで生成ページに遷移する", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForSelector('[data-testid="template-use-btn-blog-thumbnail"]');

    await page.click('[data-testid="template-use-btn-blog-thumbnail"]');

    // 生成ページに遷移（templateId クエリパラメータ付き）
    await expect(page).toHaveURL(/templateId=blog-thumbnail/, { timeout: 5000 });
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test("E2E-TP-05: テンプレート選択後に適切な設定が適用される", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForSelector('[data-testid="template-use-btn-icon"]');

    await page.click('[data-testid="template-use-btn-icon"]');
    await page.waitForURL(/templateId=icon/);
    await page.waitForSelector('[data-testid="home-page"]');
    await page.waitForTimeout(500);

    // アイコンテンプレートのサイズ（512x512）が設定される
    const widthValue = await page.locator('[data-testid="width-select"]').inputValue();
    const heightValue = await page.locator('[data-testid="height-select"]').inputValue();
    expect(widthValue).toBe("512");
    expect(heightValue).toBe("512");
  });

  test("E2E-TP-06: テンプレートページから生成ページへのナビゲーション", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);

    await page.click('[data-testid="navbar-link-生成"]');
    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test("E2E-TP-07: テンプレートページからギャラリーへのナビゲーション", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);

    await page.click('[data-testid="navbar-link-ギャラリー"]');
    await expect(page).toHaveURL(BASE_URL + "/gallery");
    await expect(page.locator('[data-testid="gallery-page"]')).toBeVisible();
  });

  test("E2E-TP-08: イラストテンプレートの SD1.5 ワークフローバッジが表示される", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForSelector('[data-testid="template-card-illustration"]');

    const badge = page.locator('[data-testid="template-workflow-badge-illustration"]');
    await expect(badge).toContainText("SD1.5");
  });

  test("E2E-TP-09: テンプレートのプロンプトプレフィックスが表示される", async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`);
    await page.waitForSelector('[data-testid="templates-grid"]');

    const prefix = page.locator('[data-testid="template-prefix-blog-thumbnail"]');
    await expect(prefix).toContainText("blog thumbnail");
  });
});
