import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#0a0b0d",
          900: "#111318",
          800: "#1b1e26",
          700: "#272b35",
          600: "#3a3f4b",
        },
        navy: {
          950: "#071624",
          900: "#0b2235",
          800: "#103149",
          700: "#174862",
        },
        offwhite: "#f7f8fa",
        // Wellstar-adjacent palette: purple + cool blue, without presenting
        // AirCareCrew.shop as an official Wellstar property or using their marks.
        violet: {
          600: "#58277f",
          500: "#6d3296",
          400: "#8246af",
          300: "#cdb3de",
          200: "#e9ddf1",
        },
        careblue: {
          700: "#006b8f",
          600: "#007fa8",
          500: "#00a6d6",
          400: "#38b8df",
          300: "#98ddef",
          200: "#d9f2f9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [],
};

export default config;
