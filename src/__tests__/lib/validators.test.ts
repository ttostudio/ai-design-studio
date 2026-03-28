import {
  validateGenerateInput,
  validateFilename,
  validateSubfolder,
} from "@/lib/validators";

describe("validateGenerateInput", () => {
  const validInput = {
    prompt: "a beautiful landscape",
    workflow: "flux-gguf",
  };

  it("accepts valid minimal input", () => {
    const result = validateGenerateInput(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.prompt).toBe("a beautiful landscape");
      expect(result.value.workflow).toBe("flux-gguf");
    }
  });

  it("rejects non-object body", () => {
    const result = validateGenerateInput("not an object");
    expect(result.ok).toBe(false);
  });

  it("rejects null body", () => {
    const result = validateGenerateInput(null);
    expect(result.ok).toBe(false);
  });

  it("rejects empty prompt", () => {
    const result = validateGenerateInput({ ...validInput, prompt: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_PROMPT");
    }
  });

  it("rejects whitespace-only prompt", () => {
    const result = validateGenerateInput({ ...validInput, prompt: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects prompt over 1000 characters", () => {
    const result = validateGenerateInput({ ...validInput, prompt: "a".repeat(1001) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PROMPT_TOO_LONG");
    }
  });

  it("accepts prompt exactly 1000 characters", () => {
    const result = validateGenerateInput({ ...validInput, prompt: "a".repeat(1000) });
    expect(result.ok).toBe(true);
  });

  it("removes control characters from prompt", () => {
    const result = validateGenerateInput({ ...validInput, prompt: "hello\x00world\x1f" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.prompt).toBe("helloworld");
    }
  });

  it("rejects invalid workflow", () => {
    const result = validateGenerateInput({ ...validInput, workflow: "invalid-workflow" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_WORKFLOW");
    }
  });

  it("accepts flux-gguf workflow", () => {
    const result = validateGenerateInput({ ...validInput, workflow: "flux-gguf" });
    expect(result.ok).toBe(true);
  });

  it("accepts sd15 workflow", () => {
    const result = validateGenerateInput({ ...validInput, workflow: "sd15" });
    expect(result.ok).toBe(true);
  });

  it("rejects width not multiple of 8", () => {
    const result = validateGenerateInput({ ...validInput, width: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_WIDTH");
    }
  });

  it("rejects width out of range", () => {
    const result = validateGenerateInput({ ...validInput, width: 50 });
    expect(result.ok).toBe(false);
  });

  it("accepts valid width", () => {
    const result = validateGenerateInput({ ...validInput, width: 1024 });
    expect(result.ok).toBe(true);
  });

  it("rejects steps out of range", () => {
    const result = validateGenerateInput({ ...validInput, steps: 200 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STEPS");
    }
  });

  it("accepts valid steps", () => {
    const result = validateGenerateInput({ ...validInput, steps: 20 });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid templateId", () => {
    const result = validateGenerateInput({ ...validInput, templateId: "INVALID ID!" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_TEMPLATE_ID");
    }
  });

  it("accepts valid templateId", () => {
    const result = validateGenerateInput({ ...validInput, templateId: "blog-thumbnail" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.templateId).toBe("blog-thumbnail");
    }
  });

  it("rejects negativePrompt over 500 chars", () => {
    const result = validateGenerateInput({ ...validInput, negativePrompt: "x".repeat(501) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NEGATIVE_PROMPT_TOO_LONG");
    }
  });

  it("accepts negativePrompt exactly 500 chars", () => {
    const result = validateGenerateInput({ ...validInput, negativePrompt: "x".repeat(500) });
    expect(result.ok).toBe(true);
  });
});

describe("validateFilename", () => {
  it("accepts valid filename", () => {
    expect(validateFilename("image_001.png")).toBe(true);
    expect(validateFilename("ComfyUI_00001_-1.png")).toBe(true);
  });

  it("rejects filename with path traversal", () => {
    expect(validateFilename("../secret.png")).toBe(false);
    expect(validateFilename("../../etc/passwd")).toBe(false);
  });

  it("rejects filename with special characters", () => {
    expect(validateFilename("file name.png")).toBe(false);
    expect(validateFilename("file<script>.png")).toBe(false);
  });
});

describe("validateSubfolder", () => {
  it("accepts valid subfolder", () => {
    expect(validateSubfolder("output")).toBe(true);
    expect(validateSubfolder("temp")).toBe(true);
  });

  it("rejects subfolder with path traversal", () => {
    expect(validateSubfolder("../secret")).toBe(false);
    expect(validateSubfolder("dir/subdir")).toBe(false);
    expect(validateSubfolder("dir\\subdir")).toBe(false);
  });

  it("accepts empty subfolder", () => {
    expect(validateSubfolder("")).toBe(true);
  });
});
