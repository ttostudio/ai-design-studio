import { TEMPLATES, getTemplate, getDefaultTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates";

describe("TEMPLATES", () => {
  it("has 6 templates", () => {
    expect(TEMPLATES).toHaveLength(6);
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

  it("includes illustration template with flux-gguf (migrated from sd15)", () => {
    const t = TEMPLATES.find((t) => t.id === "illustration");
    expect(t).toBeDefined();
    expect(t?.workflow).toBe("flux-gguf");
    expect(t?.steps).toBe(4);
    expect(t?.cfgScale).toBe(1.0);
    expect(t?.width).toBe(512);
    expect(t?.height).toBe(768);
  });

  it("includes hero-banner template", () => {
    const t = TEMPLATES.find((t) => t.id === "hero-banner");
    expect(t).toBeDefined();
    expect(t?.workflow).toBe("flux-gguf");
    expect(t?.width).toBe(1920);
    expect(t?.height).toBe(600);
  });

  it("includes avatar template", () => {
    const t = TEMPLATES.find((t) => t.id === "avatar");
    expect(t).toBeDefined();
    expect(t?.workflow).toBe("flux-gguf");
    expect(t?.width).toBe(512);
    expect(t?.height).toBe(512);
  });

  it("all templates have required fields including description", () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(["flux-gguf", "sd15"]).toContain(t.workflow);
      expect(t.width).toBeGreaterThan(0);
      expect(t.height).toBeGreaterThan(0);
      expect(t.steps).toBeGreaterThan(0);
      expect(t.promptPrefix).toBeTruthy();
    }
  });

  it("all templates use flux-gguf workflow", () => {
    for (const t of TEMPLATES) {
      expect(t.workflow).toBe("flux-gguf");
    }
  });

  it("blog-thumbnail has enhanced promptPrefix", () => {
    const t = TEMPLATES.find((t) => t.id === "blog-thumbnail");
    expect(t?.promptPrefix).toContain("professional clean design");
    expect(t?.promptPrefix).toContain("16:9");
  });

  it("sns-post has enhanced promptPrefix", () => {
    const t = TEMPLATES.find((t) => t.id === "sns-post");
    expect(t?.promptPrefix).toContain("vibrant colors");
    expect(t?.promptPrefix).toContain("square format");
  });

  it("icon has enhanced promptPrefix", () => {
    const t = TEMPLATES.find((t) => t.id === "icon");
    expect(t?.promptPrefix).toContain("minimalist flat design");
    expect(t?.promptPrefix).toContain("clean lines");
  });

  it("illustration has enhanced promptPrefix", () => {
    const t = TEMPLATES.find((t) => t.id === "illustration");
    expect(t?.promptPrefix).toContain("digital illustration");
    expect(t?.promptPrefix).toContain("rich colors");
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

describe("getDefaultTemplate", () => {
  it("returns blog-thumbnail as default", () => {
    const t = getDefaultTemplate();
    expect(t.id).toBe("blog-thumbnail");
  });

  it("DEFAULT_TEMPLATE_ID is blog-thumbnail", () => {
    expect(DEFAULT_TEMPLATE_ID).toBe("blog-thumbnail");
  });
});
