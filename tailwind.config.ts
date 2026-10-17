import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "sans-serif"],
      },
      colors: {
        night: {
          950: "#090d16",
          900: "#0f172a",
          850: "#131d36",
          800: "#1e293b",
          700: "#334155",
        },
      },
    },
  },
  plugins: [],
};

export default config;
