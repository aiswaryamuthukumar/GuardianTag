const { palette: p } = require("./src/theme/palette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: p.background,
        surface: p.surface,
        "surface-alt": p.surfaceAlt,
        border: p.border,
        primary: { DEFAULT: p.primary, light: p.primaryLight, dark: p.primaryDark },
        safe: { DEFAULT: p.safe, light: p.safeLight, dark: p.safeDark },
        warning: { DEFAULT: p.warning, light: p.warningLight, dark: p.warningDark },
        emergency: { DEFAULT: p.emergency, light: p.emergencyLight, dark: p.emergencyDark },
        muted: p.muted,
      },
    },
  },
  plugins: [],
};
