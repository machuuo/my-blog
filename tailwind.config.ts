import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./content/**/*.mdx"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
          foreground: "hsl(var(--muted-foreground))",
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
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        nb: {
          paper: "hsl(var(--nb-paper))",
          edge: "hsl(var(--nb-edge))",
          ink: "hsl(var(--nb-ink))",
          "ink-soft": "hsl(var(--nb-ink-soft))",
          rule: "hsl(var(--nb-rule) / 0.5)",
          sage: "hsl(var(--nb-sage))",
          pink: "hsl(var(--nb-pink))",
          sky: "hsl(var(--nb-sky))",
          butter: "hsl(var(--nb-butter))",
          highlight: "hsl(var(--nb-butter) / 0.6)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Gowun Dodum", "system-ui", "sans-serif"],
        serif: [
          "var(--font-serif)",
          "var(--font-serif-kr)",
          "Gaegu",
          "Georgia",
          "serif",
        ],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        hand: [
          "var(--font-hand)",
          "Architects Daughter",
          "var(--font-serif-kr)",
          "Gaegu",
          "cursive",
        ],
        hand2: [
          "var(--font-hand2)",
          "Indie Flower",
          "var(--font-serif-kr)",
          "Gaegu",
          "cursive",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "0",
      },
    },
  },
  plugins: [typography],
};
export default config;
