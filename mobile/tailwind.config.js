/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0B0B12",
        surface: "#15151F",
        "surface-alt": "#1E1E2B",
        border: "#2A2A3A",
        primary: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        safe: {
          DEFAULT: "#22C55E",
          light: "#4ADE80",
          dark: "#15803D",
        },
        warning: {
          DEFAULT: "#F97316",
          light: "#FB923C",
          dark: "#C2410C",
        },
        emergency: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#B91C1C",
        },
        muted: "#8B8B9E",
      },
    },
  },
  plugins: [],
};
