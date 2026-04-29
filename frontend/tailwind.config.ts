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
        brand: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        gold: {
          50:  "#fffdf0",
          100: "#fff9d6",
          200: "#fff0a8",
          300: "#ffe070",
          400: "#ffc832",
          500: "#f0aa0a",
          600: "#d48600",
          700: "#a86200",
          800: "#8a4e04",
          900: "#734108",
          950: "#431f00",
        },
        cream: {
          50:  "#fefcf8",
          100: "#fdf8f0",
          200: "#f9eddb",
          300: "#f3dbb8",
          400: "#e9c285",
          500: "#dda85a",
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
