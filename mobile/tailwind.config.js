/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0B0F0E",
        surface: "#151A18",
        "surface-alt": "#1B211E",
        border: "#252D29",
        hairline: "#1C2220",
        foreground: "#F1F5F3",
        primary: {
          DEFAULT: "#69D7B8",
          light: "#8BE8CD",
          dark: "#4FBFA0",
        },
        secondary: {
          DEFAULT: "#69D7B8",
          light: "#8BE8CD",
        },
        safe: {
          DEFAULT: "#69D7B8",
          light: "#8BE8CD",
          dark: "#4FBFA0",
        },
        warning: {
          DEFAULT: "#F2B84B",
          light: "#F6CC77",
          dark: "#C6952F",
        },
        emergency: {
          DEFAULT: "#EF6262",
          light: "#F49090",
          dark: "#C24A4A",
        },
        muted: {
          DEFAULT: "#9AA7A1",
          light: "#B8C2BD",
        },
      },
    },
  },
  plugins: [],
};
