import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        apex: {
          bg: "#0b0d10",
          panel: "#15181d",
          line: "#262b32",
          ink: "#e6e8eb",
          dim: "#8a93a0",
          accent: "#ff4655",
        },
      },
    },
  },
  plugins: [],
};

export default config;
