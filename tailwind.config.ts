import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0e0e10",
        accent: "#c084fc"
      },
      fontFamily: {
        display: ["'Lilita One'", "cursive"],
        body: ["'Montserrat'", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 30px rgba(192, 132, 252, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
