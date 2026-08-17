export const colors = {
  background: "#050914",
  surface: "#0B1220",
  surfaceAlt: "#111A2E",
  border: "#1E293B",
  hairline: "#182338",
  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  primaryDark: "#2563EB",
  secondary: "#8B5CF6",
  secondaryLight: "#A78BFA",
  safe: "#3EBD73",
  warning: "#D89A3E",
  emergency: "#E5484D",
  muted: "#8B93A7",
  mutedLight: "#AAB2C5",
  text: "#F1F5F9",
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
