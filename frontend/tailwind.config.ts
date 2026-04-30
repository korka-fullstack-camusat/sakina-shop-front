import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Palette inspirée du logo : vert forêt → vert vif
        brand: {
          50:  "#f2f9f3",
          100: "#d8f0db",
          200: "#b0deb6",
          300: "#78c480",
          400: "#4cad55",   // vert vif logo (feuilles)
          500: "#2e9438",
          600: "#1e7828",   // vert action principal
          700: "#185f20",
          800: "#114819",
          900: "#0a3212",
          950: "#041a08",   // vert presque noir (fond logo)
        },
        // Accent : vert lime clair (reflet métallique du S)
        lime: {
          50:  "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
          800: "#3f6212",
          900: "#365314",
        },
        cream: {
          50:  "#fafdf7",
          100: "#f2f9f0",
          200: "#e3f2e1",
          300: "#c8e6c5",
          400: "#a5d6a0",
          500: "#81c784",
        },
      },
      zIndex: {
        "60": "60",
        "70": "70",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans:  ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":  "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        shimmer:    "shimmer 1.5s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
