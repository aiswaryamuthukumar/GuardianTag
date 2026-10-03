// Single source of truth for colours: tailwind.config.js reads this for
// className styling, and TS code imports it for props that need raw values
// (SVG fills, ActivityIndicator, tab bar tints).
const palette = {
  background: "#0B0B12",
  surface: "#15151F",
  surfaceAlt: "#1E1E2B",
  border: "#2A2A3A",
  primary: "#8B5CF6",
  primaryLight: "#A78BFA",
  primaryDark: "#6D28D9",
  safe: "#22C55E",
  safeLight: "#4ADE80",
  safeDark: "#15803D",
  warning: "#F97316",
  warningLight: "#FB923C",
  warningDark: "#C2410C",
  emergency: "#EF4444",
  emergencyLight: "#F87171",
  emergencyDark: "#B91C1C",
  muted: "#8B8B9E",
  text: "#F5F5F7",
};

module.exports = { palette };
