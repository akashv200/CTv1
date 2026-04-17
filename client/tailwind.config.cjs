/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0F766E",
          success: "#15803D",
          warning: "#D97706",
          danger: "#DC2626",
          info: "#0EA5E9"
        },
        domain: {
          agriculture: "#22C55E",
          pharmaceutical: "#7C3AED",
          food: "#EA580C",
          ecommerce: "#DB2777",
          warehouse: "#0891B2"
        },
        surface: "#FFFFFF",
        border: "#E5E7EB"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        card: "0 10px 30px -15px rgba(17, 24, 39, 0.16)",
        glow: "0 0 20px rgba(15, 118, 110, 0.4), 0 0 40px rgba(15, 118, 110, 0.2)",
        "glow-dark": "0 0 20px rgba(20, 184, 166, 0.3), 0 0 40px rgba(20, 184, 166, 0.1)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #0F766E 0%, #155E75 52%, #C2410C 100%)",
        "mesh-gradient": "radial-gradient(circle at 12% 18%, rgba(20,184,166,0.16), transparent 28%), radial-gradient(circle at 82% 18%, rgba(245,158,11,0.14), transparent 24%), radial-gradient(circle at 50% 82%, rgba(14,165,233,0.14), transparent 32%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
