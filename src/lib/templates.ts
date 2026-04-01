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
  // Webアプリ用
  {
    id: "web-dashboard",
    name: "Webダッシュボード",
    description: "Webアプリのダッシュボード画面モックアップ。KPIカード・グラフ・サイドバーを含むプロフェッショナルなUI構成です。",
    workflow: "flux-gguf",
    width: 1440,
    height: 900,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "web dashboard UI screenshot, data visualization charts, KPI cards, sidebar navigation, clean modern interface, desktop application, professional design, high quality,",
  },
  {
    id: "web-settings",
    name: "Web設定画面",
    description: "Webアプリの設定・管理画面モックアップ。フォーム・入力フィールド・トグルスイッチを含む整然としたレイアウトです。",
    workflow: "flux-gguf",
    width: 1440,
    height: 900,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "web settings page UI screenshot, form fields, toggle switches, input elements, clean layout, admin panel, professional web design, high quality,",
  },
  {
    id: "web-list",
    name: "Web一覧画面",
    description: "Webアプリのデータ一覧画面モックアップ。テーブルまたはカードグリッドで情報を整理した使いやすいUIです。",
    workflow: "flux-gguf",
    width: 1440,
    height: 900,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "web list page UI screenshot, data table, card grid layout, search bar, filter options, pagination, clean modern interface, professional web design, high quality,",
  },
  // モバイルアプリ用
  {
    id: "mobile-home",
    name: "モバイルホーム画面",
    description: "iPhoneサイズのモバイルアプリホーム画面。タブバー・コンテンツカード・ナビゲーションを含むモダンなUIです。",
    workflow: "flux-gguf",
    width: 390,
    height: 844,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "mobile app home screen UI screenshot, tab bar navigation, content cards, clean mobile interface, iOS design, modern app design, high quality,",
  },
  {
    id: "mobile-profile",
    name: "モバイルプロフィール画面",
    description: "iPhoneサイズのモバイルアプリプロフィール画面。アバター・ユーザー情報・統計・アクションボタンを配置したUIです。",
    workflow: "flux-gguf",
    width: 390,
    height: 844,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "mobile app profile screen UI screenshot, user avatar, profile information, stats, action buttons, clean mobile interface, iOS design, high quality,",
  },
  {
    id: "mobile-chat",
    name: "モバイルチャット画面",
    description: "iPhoneサイズのモバイルアプリチャット画面。メッセージバブル・入力エリア・会話リストを含む直感的なUIです。",
    workflow: "flux-gguf",
    width: 390,
    height: 844,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "mobile chat app UI screenshot, message bubbles, text input field, conversation list, clean messaging interface, iOS design, modern mobile design, high quality,",
  },
  // ランディングページ用
  {
    id: "lp-hero",
    name: "LPヒーローセクション",
    description: "ランディングページのファーストビュー。インパクトのあるヒーロービジュアル・キャッチコピー・CTAボタンを組み合わせたセクションです。",
    workflow: "flux-gguf",
    width: 1440,
    height: 900,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "landing page hero section, compelling hero image, headline text, CTA button, modern web design, professional layout, high visual impact, high quality,",
  },
  {
    id: "lp-feature",
    name: "LP機能紹介セクション",
    description: "ランディングページの機能紹介セクション。3カラムグリッドにアイコン・見出し・説明文を配置したクリーンなレイアウトです。",
    workflow: "flux-gguf",
    width: 1440,
    height: 900,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "landing page features section, three column grid layout, feature icons, headlines, description text, clean professional design, modern web layout, high quality,",
  },
  {
    id: "lp-cta",
    name: "LPCTAセクション",
    description: "ランディングページのコンバージョン促進セクション。鮮やかな背景色に大きなCTAボタンと訴求テキストを配置したセクションです。",
    workflow: "flux-gguf",
    width: 1440,
    height: 600,
    steps: 4,
    cfgScale: 1.0,
    promptPrefix: "landing page CTA section, call to action button, persuasive headline, vibrant background color, conversion focused design, modern web design, high quality,",
  },
];

export const DEFAULT_TEMPLATE_ID = "blog-thumbnail";

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getDefaultTemplate(): Template {
  return TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) ?? TEMPLATES[0];
}
