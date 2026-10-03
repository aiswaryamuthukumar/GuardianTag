// Single source of truth for colours (the feature/frontend teal theme):
// tailwind.config.js reads this for className styling, and TS code imports it
// for props that need raw values (SVG fills, icons, switches, tab bar tints).
const palette = {
  background: "#0B0F0E",
  surface: "#151A18",
  surfaceAlt: "#1B211E",
  border: "#252D29",
  hairline: "#1C2220",
  text: "#F1F5F3",
  primary: "#69D7B8",
  primaryLight: "#8BE8CD",
  primaryDark: "#4FBFA0",
  safe: "#69D7B8",
  safeLight: "#8BE8CD",
  safeDark: "#4FBFA0",
  warning: "#F2B84B",
  warningLight: "#F6CC77",
  warningDark: "#C6952F",
  emergency: "#EF6262",
  emergencyLight: "#F49090",
  emergencyDark: "#C24A4A",
  muted: "#9AA7A1",
  mutedLight: "#B8C2BD",
};

module.exports = { palette };
