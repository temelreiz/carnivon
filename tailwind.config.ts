import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Agro-luxury palette: deep forest / cream / antique gold
        forest: {
          50: "#f2f5f2",
          100: "#dde5dd",
          200: "#b9c9b9",
          300: "#8ea58e",
          400: "#688268",
          500: "#4e684e",
          600: "#3d523d",
          700: "#2f3f2f",
          800: "#1f2a1f",
          900: "#0f150f",
          950: "#080b08",
        },
        cream: {
          50: "#faf7f0",
          100: "#f4eddc",
          200: "#e8d9b8",
          300: "#dbc28e",
          400: "#cfa964",
          500: "#c49145",
          600: "#a6783a",
          700: "#835d30",
          800: "#5f422b",
          900: "#3f2c1e",
        },
        gold: {
          DEFAULT: "#b8893a",
          soft: "#d4a84a",
          deep: "#8a6528",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      maxWidth: {
        container: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
