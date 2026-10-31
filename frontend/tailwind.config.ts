import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        psoe: {
          red: "#E30613",
          deep: "#B0000C",
          hot: "#FF1F2E",
          rose: "#FFF0F1",
          ink: "#1A1A1A",
          mist: "#F5F5F5",
          line: "#E8E8E8",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#333333",
          mute: "#6B6B6B",
        },
        paper: {
          DEFAULT: "#FAFAFA",
          card: "#FFFFFF",
          line: "#E8E8E8",
        },
        signal: {
          DEFAULT: "#E30613",
          bright: "#FF1F2E",
          wash: "#FFF0F1",
          warn: "#B45309",
          danger: "#E30613",
        },
        provenance: {
          official: "#E30613",
          calculated: "#1A1A1A",
          unavailable: "#6B6B6B",
          sample: "#B45309",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Arial Black", "sans-serif"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 8px 30px rgba(227, 6, 19, 0.08)",
        punch: "0 16px 50px rgba(227, 6, 19, 0.22)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(227,6,19,0.35)" },
          "50%": { boxShadow: "0 0 0 12px rgba(227,6,19,0)" },
        },
      },
      animation: {
        rise: "rise 0.7s ease-out both",
        "pulse-red": "pulseRed 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;