export interface Template {
  id: string;
  name: string;
  workflow: "flux-gguf" | "sd15";
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  promptPrefix: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "blog-thumbnail",
    name: "ブログサムネイル",
    workflow: "flux-gguf",
    width: 1024,
    height: 576,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "blog thumbnail, clean design, ",
  },
  {
    id: "sns-post",
    name: "SNS投稿画像",
    workflow: "flux-gguf",
    width: 1024,
    height: 1024,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "social media post, vibrant, ",
  },
  {
    id: "icon",
    name: "アイコン",
    workflow: "flux-gguf",
    width: 512,
    height: 512,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "icon, minimalist, centered, ",
  },
  {
    id: "illustration",
    name: "イラスト",
    workflow: "sd15",
    width: 512,
    height: 768,
    steps: 20,
    cfgScale: 7.0,
    promptPrefix: "illustration, detailed, ",
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
