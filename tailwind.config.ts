import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0f0f11",
        "bg-surface": "#1a1a1f",
        "bg-elevated": "#252529",
        border: "#2e2e35",
        "text-primary": "#f0f0f2",
        "text-secondary": "#9090a0",
        "text-disabled": "#50505a",
        accent: "#7c6af7",
        "accent-hover": "#9080ff",
        "accent-muted": "#2e2a5a",
        success: "#4caf7d",
        warning: "#f5a623",
        error: "#e05252",
        progress: "#7c6af7",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans JP", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.4)",
      },
      transitionDuration: {
        default: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
