import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FDFBF7",
        forest: "#1F4E3D",
        amber: "#E8A33D",
        ink: "#1A1A1A",
        muted: "#6B6B6B",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
        serif: ["var(--font-fraunces)", "serif"],
      },
      boxShadow: {
        card: "0 10px 35px rgba(31, 78, 61, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
