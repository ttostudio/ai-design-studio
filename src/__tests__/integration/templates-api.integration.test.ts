/**
 * 結合テスト: GET /api/templates
 * テンプレート API は DB を使わずに静的データを返すが、
 * Next.js アプリ経由でレスポンスを検証する結合テスト。
 */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3700";

// ── IT-T01: GET /api/templates ──────────────────────────────────────────────
it("IT-T01-01: GET /api/templates returns all templates", async () => {
  const res = await fetch(`${BASE_URL}/api/templates`);
  expect(res.status).toBe(200);
  const body = await res.json();

  expect(body.data).toBeDefined();
  expect(Array.isArray(body.data.items)).toBe(true);
  expect(body.data.items.length).toBeGreaterThan(0);
});

it("IT-T01-02: templates include required fields", async () => {
  const res = await fetch(`${BASE_URL}/api/templates`);
  const body = await res.json();

  body.data.items.forEach(
    (tpl: { id: string; name: string; workflow: string; width: number; height: number; promptPrefix: string }) => {
      expect(typeof tpl.id).toBe("string");
      expect(typeof tpl.name).toBe("string");
      expect(typeof tpl.workflow).toBe("string");
      expect(typeof tpl.width).toBe("number");
      expect(typeof tpl.height).toBe("number");
      expect(typeof tpl.promptPrefix).toBe("string");
    }
  );
});

it("IT-T01-03: blog-thumbnail template has correct dimensions", async () => {
  const res = await fetch(`${BASE_URL}/api/templates`);
  const body = await res.json();
  const blogTpl = body.data.items.find((t: { id: string }) => t.id === "blog-thumbnail");

  expect(blogTpl).toBeDefined();
  expect(blogTpl.width).toBe(1024);
  expect(blogTpl.height).toBe(576);
  expect(blogTpl.workflow).toBe("flux-gguf");
  expect(blogTpl.promptPrefix).toContain("blog thumbnail");
});

it("IT-T01-04: generate with invalid templateId returns 404", async () => {
  // workflow は必須。templateId が存在しない場合は 404
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "test",
      workflow: "flux-gguf",
      templateId: "nonexistent-template-xyz",
    }),
  });
  expect(res.status).toBe(404);
  const body = await res.json();
  expect(body.error).toBeDefined();
});
