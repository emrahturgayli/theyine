import type { Config } from "tailwindcss";

/**
 * THEYINE — Tailwind configuration
 * Light, premium, minimal aesthetic built on the official brand palette:
 *  - Soft White surface, Charcoal ink, refined Lavender accents.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (brand.md §7) driven by CSS variables so the same
        // utility classes adapt across light/dark themes. Channels are stored
        // as space-separated RGB so Tailwind's /opacity modifiers keep working.
        canvas: "rgb(var(--canvas) / <alpha-value>)", // primary background
        surface: "rgb(var(--surface) / <alpha-value>)", // cards
        mist: "rgb(var(--mist) / <alpha-value>)", // secondary surfaces
        line: "rgb(var(--line) / <alpha-value>)", // hairline borders
        ink: "rgb(var(--ink) / <alpha-value>)", // primary text
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)", // muted text
        "ink-faint": "rgb(var(--ink-faint) / <alpha-value>)", // captions
        lavender: "rgb(var(--lavender) / <alpha-value>)", // accent
        "lavender-soft": "rgb(var(--lavender-soft) / <alpha-value>)",
        "lavender-tint": "rgb(var(--lavender-tint) / <alpha-value>)",
        // Always-dark CTA panel (stable in both themes)
        panel: "rgb(var(--panel) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      maxWidth: {
        container: "1280px",
      },
      spacing: {
        section: "9rem",
      },
      borderRadius: {
        xl2: "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31, 24, 39, 0.04), 0 12px 40px -12px rgba(31, 24, 39, 0.12)",
        lift: "0 24px 60px -20px rgba(124, 58, 237, 0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 1s ease both",
        float: "float 7s ease-in-out infinite",
        "spin-slow": "spin-slow 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
