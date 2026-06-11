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
        // 중립색: semantic 별칭 참조 (globals.css에서 --nb-* primitive를 가리킴, light/dark 자동 추종)
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
        // notebook 전용 액센트/장식 토큰 (text-nb-sage, bg-nb-highlight, border-nb-rule …)
        nb: {
          paper: "var(--nb-paper)",
          ink: "var(--nb-ink)",
          "ink-soft": "var(--nb-ink-soft)",
          rule: "var(--nb-rule)",
          sage: "var(--nb-sage)",
          pink: "var(--nb-pink)",
          sky: "var(--nb-sky)",
          butter: "var(--nb-butter)",
          highlight: "var(--nb-highlight)",
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
