import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B3D2E", // verde corporativo oscuro
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};
export default config;
