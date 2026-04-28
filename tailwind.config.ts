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
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          page: "#F8F9FA",
        },
        /** Primary red — Waresport / WARE SPORT palette */
        brand: {
          50: "#fef2f2",
          100: "#fde8e8",
          200: "#fbd5d5",
          300: "#f5a3a3",
          400: "#eb6b6b",
          500: "#e01e1e",
          600: "#d30000",
          700: "#b10202",
          800: "#920a0a",
          900: "#7a0f0f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
