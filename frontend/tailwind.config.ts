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
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fillBar: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--bar-width)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        rise: "rise 0.7s ease-out both",
        "pulse-red": "pulseRed 2.4s ease-out infinite",
        'count-up': 'countUp 0.5s ease-out both',
        'fill-bar': 'fillBar 1.5s ease-out both',
        'fade-in-up': 'fadeInUp 0.8s ease-out both',
        'scale-in': 'scaleIn 0.6s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;