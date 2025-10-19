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
        body: ["'Montserrat'", "sans-serif"],
        'Bigbesty': ["Bigbesty", "system-ui", "sans-serif"],
        'sans': ["Bigbesty", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 30px rgba(192, 132, 252, 0.45)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out"
      }
    }
  },
  plugins: []
};

export default config;
