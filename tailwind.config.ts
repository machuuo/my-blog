import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn bridge: nb semantic 토큰 참조 (globals.css --nb-* → primitive cascade)
        border: "var(--border)",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 강조색: shadcn 기본 유지 (향후 확장 PR 범위)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // notebook semantic 토큰 (bg-nb-paper, text-nb-ink, bg-nb-tape …)
        // primitive (sand/brown/green/…)는 CSS 변수 전용 — Tailwind 미노출
        nb: {
          // Surface
          paper:       "var(--nb-paper)",
          "paper-hi":  "var(--nb-paper-hi)",
          edge:        "var(--nb-edge)",
          // Text
          ink:         "var(--nb-ink)",
          "ink-soft":  "var(--nb-ink-soft)",
          // Border
          rule:        "var(--nb-rule)",
          // Accent
          tape:        "var(--nb-tape)",
          memo:        "var(--nb-memo)",
          photo:       "var(--nb-photo)",
          highlight:   "var(--nb-highlight)",
          // backward-compat — PR B에서 새 semantic 이름으로 치환 후 제거
          sage:        "var(--nb-sage)",
          pink:        "var(--nb-pink)",
          sky:         "var(--nb-sky)",
          butter:      "var(--nb-butter)",
          // Elevation
          "shadow-sm": "var(--nb-shadow-sm)",
          "shadow-md": "var(--nb-shadow-md)",
          "shadow-lg": "var(--nb-shadow-lg)",
          // Typography
          "font-hand":  "var(--nb-font-hand)",
          "font-hand2": "var(--nb-font-hand2)",
          "font-body":  "var(--nb-font-body)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [typography],
};
export default config;
