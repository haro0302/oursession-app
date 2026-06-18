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
        bg: {
          DEFAULT: "#15151a",
          2: "#1a1a20",
          3: "#22222a",
        },
        card: {
          DEFAULT: "rgba(26,26,32,0.55)",
          2: "rgba(34,34,42,0.5)",
          hl: "rgba(42,42,50,0.7)",
        },
        brand: {
          DEFAULT: "#e84a5f",
          2: "#ed6a7c",
          bg: "rgba(232,74,95,0.10)",
          border: "rgba(232,74,95,0.32)",
          glow: "rgba(232,74,95,0.35)",
        },
        txt: {
          DEFAULT: "#f5f5f7",
          2: "#9a9aa8",
          3: "#5a5a66",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          2: "rgba(255,255,255,0.12)",
        },
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "sans-serif"],
      },
      backdropBlur: {
        card: "20px",
      },
      borderRadius: {
        card: "16px",
        "card-lg": "20px",
      },
      animation: {
        "aurora-1": "auroraFloat1 28s ease-in-out infinite",
        "aurora-2": "auroraFloat2 34s ease-in-out infinite",
        "aurora-3": "auroraFloat3 24s ease-in-out infinite",
        "aurora-4": "auroraFloat4 30s ease-in-out infinite",
        "listening-pulse": "listeningPulse 2.2s ease-in-out infinite",
        "rec-pulse": "recPulse 1.2s ease-in-out infinite",
      },
      keyframes: {
        auroraFloat1: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(60px,80px) scale(1.15)" },
          "66%": { transform: "translate(-40px,140px) scale(0.95)" },
        },
        auroraFloat2: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "40%": { transform: "translate(-70px,60px) scale(1.1)" },
          "70%": { transform: "translate(-30px,-50px) scale(1.05)" },
        },
        auroraFloat3: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(80px,-90px) scale(1.2)" },
        },
        auroraFloat4: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "35%": { transform: "translate(-60px,-70px) scale(0.9)" },
          "70%": { transform: "translate(40px,30px) scale(1.15)" },
        },
        listeningPulse: {
          "0%,100%": {
            opacity: "0.5",
            transform: "scale(0.85)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.15)",
            boxShadow: "0 0 8px rgba(126,200,138,0.6)",
          },
        },
        recPulse: {
          "0%,100%": {
            opacity: "0.4",
            transform: "scale(0.9)",
            boxShadow: "0 0 0 0 rgba(232,74,95,0.6)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.15)",
            boxShadow: "0 0 0 8px rgba(232,74,95,0)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
