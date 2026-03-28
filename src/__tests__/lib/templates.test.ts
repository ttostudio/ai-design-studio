import { TEMPLATES, getTemplate } from "@/lib/templates";

describe("TEMPLATES", () => {
  it("has 4 templates", () => {
    expect(TEMPLATES).toHaveLength(4);
  });

  it("includes blog-thumbnail template", () => {
    const t = TEMPLATES.find((t) => t.id === "blog-thumbnail");
    expect(t).toBeDefined();
    expect(t?.workflow).toBe("flux-gguf");
    expect(t?.width).toBe(1024);
    expect(t?.height).toBe(576);
  });

  it("includes sns-post template", () => {
    const t = TEMPLATES.find((t) => t.id === "sns-post");
    expect(t).toBeDefined();
    expect(t?.width).toBe(1024);
    expect(t?.height).toBe(1024);
  });

  it("includes icon template", () => {
    const t = TEMPLATES.find((t) => t.id === "icon");
    expect(t).toBeDefined();
    expect(t?.width).toBe(512);
    expect(t?.height).toBe(512);
  });

  it("includes illustration template with sd15", () => {
    const t = TEMPLATES.find((t) => t.id === "illustration");
    expect(t).toBeDefined();
    expect(t?.workflow).toBe("sd15");
    expect(t?.width).toBe(512);
    expect(t?.height).toBe(768);
  });

  it("all templates have required fields", () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(["flux-gguf", "sd15"]).toContain(t.workflow);
      expect(t.width).toBeGreaterThan(0);
      expect(t.height).toBeGreaterThan(0);
      expect(t.steps).toBeGreaterThan(0);
      expect(t.promptPrefix).toBeTruthy();
    }
  });
});

describe("getTemplate", () => {
  it("returns the template by id", () => {
    const t = getTemplate("blog-thumbnail");
    expect(t).toBeDefined();
    expect(t?.id).toBe("blog-thumbnail");
  });

  it("returns undefined for unknown id", () => {
    const t = getTemplate("nonexistent");
    expect(t).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    const t = getTemplate("");
    expect(t).toBeUndefined();
  });
});
