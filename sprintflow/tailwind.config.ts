import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        dm: ["var(--font-dm-sans)", "sans-serif"],
      },
      colors: {
        bg: "#0a0a0f",
        surface: "#111118",
        surface2: "#18181f",
        accent: "#4f7cff",
        accent2: "#a259ff",
        accent3: "#00d4aa",
        muted: "#6b6b80",
        muted2: "#9090a8",
        border: "rgba(255,255,255,0.07)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease both",
        "fade-up-delay-1": "fadeUp 0.6s 0.1s ease both",
        "fade-up-delay-2": "fadeUp 0.6s 0.2s ease both",
        "fade-up-delay-3": "fadeUp 0.6s 0.3s ease both",
        "fade-up-delay-4": "fadeUp 0.6s 0.4s ease both",
        "fade-up-delay-5": "fadeUp 0.8s 0.5s ease both",
        float: "float 8s ease-in-out infinite",
        "float-reverse": "float 10s ease-in-out infinite reverse",
        pulse2: "pulse2 2s ease infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-30px)" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #4f7cff, #a259ff)",
        "gradient-text": "linear-gradient(135deg, #f0f0f5, #9090a8)",
      },
      boxShadow: {
        mockup:
          "0 0 0 1px rgba(79,124,255,0.1), 0 32px 80px rgba(0,0,0,0.6), 0 0 120px rgba(79,124,255,0.06)",
        "glow-accent": "0 0 8px #00d4aa",
      },
    },
  },
  plugins: [],
};

export default config;
