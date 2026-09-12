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
          950: "#050a14",
          900: "#0a1628",
          800: "#0f2244",
          700: "#163363",
        },
        offwhite: "#f6f4ef",
        amber: {
          500: "#f2a900",
          400: "#f7b733",
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
