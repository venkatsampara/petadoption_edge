import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        forest: "var(--color-forest)",
        "forest-strong": "var(--color-forest-strong)",
        amber: "var(--color-amber)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        eyebrow: "var(--color-eyebrow)",
        soft: "var(--color-soft)",
        "image-surface": "var(--color-image-surface)",
        "token-border": "var(--color-border)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Noto Sans Telugu", "Nirmala UI", "sans-serif"],
        serif: ["var(--font-fraunces)", "Noto Serif Telugu", "Nirmala UI", "serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};

export default config;
