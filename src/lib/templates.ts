export interface Template {
  id: string;
  name: string;
  description: string;
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
    description: "ブログ記事用の横長サムネイル画像（16:9）。プロフェッショナルなレイアウトと鮮明なタイポグラフィで読者の目を引きます。",
    workflow: "flux-gguf",
    width: 1024,
    height: 576,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "blog thumbnail, professional clean design, modern layout, typography, high quality, 16:9,",
  },
  {
    id: "sns-post",
    name: "SNS投稿画像",
    description: "Instagram・X（Twitter）等のSNS投稿用正方形画像。鮮やかな色彩と印象的な構図でエンゲージメントを高めます。",
    workflow: "flux-gguf",
    width: 1024,
    height: 1024,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "social media post, vibrant colors, eye-catching composition, engaging visual, high quality, square format,",
  },
  {
    id: "icon",
    name: "アイコン",
    description: "アプリ・サービス用のアイコン画像。ミニマルなフラットデザインで、小サイズでも視認性の高いシンプルな造形です。",
    workflow: "flux-gguf",
    width: 512,
    height: 512,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "icon, minimalist flat design, centered composition, clean lines, simple shapes, professional,",
  },
  {
    id: "illustration",
    name: "イラスト",
    description: "小説・記事・ブログ等に添える挿絵用デジタルイラスト。豊かな色彩と詳細な描写で世界観を表現します。",
    workflow: "flux-gguf",
    width: 512,
    height: 768,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "digital illustration, detailed artwork, beautiful composition, rich colors, high quality, artistic,",
  },
  {
    id: "hero-banner",
    name: "ヒーローバナー",
    description: "Webサイトのトップに配置するワイドバナー画像。インパクトのある広大な構図でブランドイメージを伝えます。",
    workflow: "flux-gguf",
    width: 1920,
    height: 600,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "hero banner, wide landscape, dramatic composition, cinematic, professional web design, high quality,",
  },
  {
    id: "avatar",
    name: "アバター",
    description: "プロフィール・SNSアカウント用のアバター画像。中央に被写体を配置したクリーンな正方形構図です。",
    workflow: "flux-gguf",
    width: 512,
    height: 512,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "avatar, portrait, centered subject, clean background, professional, high quality,",
  },
];

export const DEFAULT_TEMPLATE_ID = "blog-thumbnail";

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): Template {
  return TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) ?? TEMPLATES[0];
}
