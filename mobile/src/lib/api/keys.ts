// Every React Query key in one place, so realtime updates and mutations
// invalidate exactly what the screens read.
export const qk = {
  me: ["me"] as const,
  myWardens: ["me", "wardens"] as const,
  devices: ["devices"] as const,
  device: (id: string) => ["devices", id] as const,
  deviceHealth: (id: string) => ["device-health", id] as const,
  assets: ["assets"] as const,
  asset: (id: string) => ["assets", id] as const,
  schedules: ["schedules"] as const,
  events: (filter?: object) => ["events", filter ?? {}] as const,
  liveEvents: ["events", "live"] as const,
  incidents: (filter?: object) => ["incidents", filter ?? {}] as const,
  incident: (id: string) => ["incident", id] as const,
  notifications: ["notifications"] as const,
  unread: ["notifications", "unread"] as const,
  notices: ["notices"] as const,
  analytics: (name: string, params?: object) => ["analytics", name, params ?? {}] as const,
  level: ["gamification", "level"] as const,
  progress: ["gamification", "progress"] as const,
  xp: ["gamification", "xp"] as const,
  warden: (name: string) => ["warden", name] as const,
};
