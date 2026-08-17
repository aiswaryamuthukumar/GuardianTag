/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#050914",
        surface: "#0B1220",
        "surface-alt": "#111A2E",
        border: "#1E293B",
        hairline: "#182338",
        foreground: "#F1F5F9",
        primary: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
        },
        safe: {
          DEFAULT: "#3EBD73",
          light: "#6BD394",
          dark: "#2C9257",
        },
        warning: {
          DEFAULT: "#D89A3E",
          light: "#E5B466",
          dark: "#AD7A2C",
        },
        emergency: {
          DEFAULT: "#E5484D",
          light: "#EF7A7E",
          dark: "#B93337",
        },
        muted: {
          DEFAULT: "#8B93A7",
          light: "#AAB2C5",
        },
      },
    },
  },
  plugins: [],
};
