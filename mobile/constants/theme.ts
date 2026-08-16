export const colors = {
  background: "#0B0B12",
  surface: "#15151F",
  surfaceAlt: "#1E1E2B",
  border: "#2A2A3A",
  primary: "#8B5CF6",
  primaryLight: "#A78BFA",
  primaryDark: "#6D28D9",
  safe: "#22C55E",
  warning: "#F97316",
  emergency: "#EF4444",
  muted: "#8B8B9E",
  text: "#F5F5F7",
} as const;

export type GuardianLevelLabel =
  | "Rookie"
  | "Watchman"
  | "Guardian"
  | "Sentinel"
  | "Hostel Protector";

export const guardianLevels: GuardianLevelLabel[] = [
  "Rookie",
  "Watchman",
  "Guardian",
  "Sentinel",
  "Hostel Protector",
];
