import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A2417",
        forest: "#0E3B22",
        leaf: { DEFAULT: "#1E8E4E", 600: "#16763F" },
        sprout: { DEFAULT: "#6FE08A", soft: "#BBF0C9" },
        honey: "#F2B441",
        cream: { DEFAULT: "#FBFDF8", 100: "#F1F7EE" },
        text: "#16291E",
        muted: "#5E7065",
        line: "#E3EEE3",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
