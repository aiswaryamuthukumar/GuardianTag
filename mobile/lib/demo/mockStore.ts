import type {
  Achievement,
  Asset,
  Challenge,
  Device,
  Evidence,
  Incident,
  IncidentDetail,
  IncidentTimelineEvent,
  Notification,
  SecurityScore,
  TelegramLinkCode,
  User,
  UserAchievement,
  XPTransaction,
} from "@/types/api";

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${seq++}`;

const now = () => new Date();
const hoursAgo = (h: number) => new Date(now().getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
const iso = () => now().toISOString();

export const user: User = {
  id: "demo-hostdost-user",
  created_at: daysAgo(90),
  updated_at: iso(),
  clerk_user_id: "demo-hostdost-user",
  email: "aiswarya@hostdost.local",
  full_name: "Aiswarya M",
  room_number: "A101",
  phone: null,
  avatar_url: null,
  level: "guardian",
  telegram_chat_id: null,
};

export const devices: Device[] = [
  {
    id: "device-1",
    created_at: daysAgo(60),
    updated_at: hoursAgo(1),
    owner_id: user.id,
    name: "Room A101 Node",
    device_uid: "esp32-aa:bb:cc",
    status: "online",
    firmware_version: "1.4.2",
    last_seen_at: hoursAgo(0),
  },
  {
    id: "device-2",
    created_at: daysAgo(30),
    updated_at: hoursAgo(6),
    owner_id: user.id,
    name: "Backpack Node",
    device_uid: "esp32-dd:ee:ff",
    status: "degraded",
    firmware_version: "1.3.9",
    last_seen_at: hoursAgo(5),
  },
];

export const assets: Asset[] = [
  {
    id: "asset-1",
    created_at: daysAgo(60),
    updated_at: hoursAgo(2),
    owner_id: user.id,
    device_id: "device-2",
    name: "College Backpack",
    category: "bag",
    description: "Blue backpack with laptop compartment.",
    photo_url: null,
    is_armed: true,
  },
  {
    id: "asset-2",
    created_at: daysAgo(45),
    updated_at: hoursAgo(10),
    owner_id: user.id,
    device_id: "device-1",
    name: "MacBook Air",
    category: "laptop",
    description: "Personal laptop, kept on the desk.",
    photo_url: null,
    is_armed: false,
  },
  {
    id: "asset-3",
    created_at: daysAgo(20),
    updated_at: daysAgo(1),
    owner_id: user.id,
    device_id: null,
    name: "Passport & Documents",
    category: "document",
    description: "Passport, ID cards, and certificates folder.",
    photo_url: null,
    is_armed: true,
  },
];

const timelineFor = (incidentId: string): IncidentTimelineEvent[] => [
  {
    id: nextId("evt"),
    incident_id: incidentId,
    event_type: "sensor_event",
    description: "Movement detected by sensor node",
    actor: "device",
    event_metadata: null,
    occurred_at: hoursAgo(3),
  },
  {
    id: nextId("evt"),
    incident_id: incidentId,
    event_type: "incident_created",
    description: "Incident auto-created after unverified movement",
    actor: "system",
    event_metadata: null,
    occurred_at: hoursAgo(3),
  },
];

const evidenceFor = (incidentId: string): Evidence[] => [
  {
    id: nextId("ev"),
    incident_id: incidentId,
    type: "sensor_snapshot",
    url: null,
    content: "Accelerometer spike: 4.2g, duration 800ms",
    captured_at: hoursAgo(3),
  },
];

export const incidents: IncidentDetail[] = [
  {
    id: "incident-1",
    created_at: hoursAgo(3),
    updated_at: hoursAgo(3),
    user_id: user.id,
    device_id: "device-2",
    asset_id: "asset-1",
    title: "Unverified movement — College Backpack",
    description: "Backpack node reported movement while armed and away from your paired phone.",
    status: "open",
    severity: "high",
    triggered_at: hoursAgo(3),
    resolved_at: null,
    resolution_notes: null,
    timeline_events: timelineFor("incident-1"),
    evidence_items: evidenceFor("incident-1"),
  },
  {
    id: "incident-2",
    created_at: daysAgo(3),
    updated_at: daysAgo(3),
    user_id: user.id,
    device_id: "device-1",
    asset_id: "asset-2",
    title: "Movement detected — MacBook Air",
    description: "Turned out to be a roommate moving the laptop to charge it.",
    status: "false_alarm",
    severity: "low",
    triggered_at: daysAgo(3),
    resolved_at: daysAgo(3),
    resolution_notes: "Confirmed with roommate, no theft.",
    timeline_events: timelineFor("incident-2"),
    evidence_items: [],
  },
  {
    id: "incident-3",
    created_at: daysAgo(9),
    updated_at: daysAgo(9),
    user_id: user.id,
    device_id: "device-2",
    asset_id: "asset-1",
    title: "Dual-verified alert — College Backpack",
    description: "Hall sensor and bag sensor both triggered within 2 seconds.",
    status: "resolved",
    severity: "critical",
    triggered_at: daysAgo(9),
    resolved_at: daysAgo(9),
    resolution_notes: "Bag was moved by hostel warden during a routine check; verified on CCTV.",
    timeline_events: timelineFor("incident-3"),
    evidence_items: evidenceFor("incident-3"),
  },
];

export const securityScore: SecurityScore = {
  score: 1240,
  level: "guardian",
  streak_days: 12,
  last_calculated_at: iso(),
};

export const xpTransactions: XPTransaction[] = [
  { id: nextId("xp"), amount: 50, reason: "Armed all assets before leaving", reference_type: null, reference_id: null, created_at: hoursAgo(5) },
  { id: nextId("xp"), amount: 100, reason: "Resolved incident quickly", reference_type: "incident", reference_id: "incident-3", created_at: daysAgo(9) },
  { id: nextId("xp"), amount: -20, reason: "False alarm reported", reference_type: "incident", reference_id: "incident-2", created_at: daysAgo(3) },
  { id: nextId("xp"), amount: 30, reason: "7-day arming streak", reference_type: null, reference_id: null, created_at: daysAgo(5) },
];

const achievementCatalog: Achievement[] = [
  { id: "ach-1", key: "first_arm", name: "First Line of Defense", description: "Arm your first asset.", icon: "🛡️", xp_reward: 20 },
  { id: "ach-2", key: "week_streak", name: "Week-Long Watch", description: "Keep Guardian Mode active for 7 days straight.", icon: "🔥", xp_reward: 50 },
  { id: "ach-3", key: "quick_resolver", name: "Quick Resolver", description: "Resolve an incident within 5 minutes.", icon: "⚡", xp_reward: 100 },
  { id: "ach-4", key: "fully_armed", name: "Fully Armed", description: "Arm every asset you own at the same time.", icon: "🏰", xp_reward: 75 },
  { id: "ach-5", key: "hostel_protector", name: "Hostel Protector", description: "Reach the Hostel Protector guardian level.", icon: "🏆", xp_reward: 200 },
];

export const achievements: Achievement[] = achievementCatalog;

export const unlockedAchievements: UserAchievement[] = [
  { id: nextId("uach"), achievement: achievementCatalog[0], unlocked_at: daysAgo(55) },
  { id: nextId("uach"), achievement: achievementCatalog[1], unlocked_at: daysAgo(20) },
  { id: nextId("uach"), achievement: achievementCatalog[2], unlocked_at: daysAgo(9) },
];

export const challenges: Challenge[] = [
  { id: "chal-1", key: "arm_streak_14", title: "14-Day Arming Streak", description: "Arm at least one asset every day for 14 days.", xp_reward: 80, is_active: true, start_at: daysAgo(2), end_at: daysAgo(-12) },
  { id: "chal-2", key: "zero_false_alarms", title: "Zero False Alarms", description: "Go a full week without a false alarm.", xp_reward: 60, is_active: true, start_at: daysAgo(1), end_at: daysAgo(-6) },
  { id: "chal-3", key: "pair_second_device", title: "Double Coverage", description: "Pair a second sensor node.", xp_reward: 40, is_active: false, start_at: daysAgo(40), end_at: daysAgo(10) },
];

export function telegramLinkCode(): TelegramLinkCode {
  user.telegram_chat_id = user.telegram_chat_id ?? "demo-telegram-chat";
  return { link_code: "DEMO-482913", deep_link: null };
}

export function analyticsSummary() {
  return {
    total_devices: devices.length,
    total_assets: assets.length,
    open_incidents: incidents.filter((i) => i.status === "open" || i.status === "investigating").length,
    resolved_incidents: incidents.filter((i) => i.status === "resolved").length,
    false_alarms: incidents.filter((i) => i.status === "false_alarm").length,
  };
}

export function analyticsTrend(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const dayIndex = days - 1 - i;
    const date = new Date(now().getTime() - dayIndex * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const count = [9, 3, 0].includes(dayIndex) ? 1 : 0;
    return { date, count };
  });
}

export function responseTimes() {
  return {
    avg_resolution_seconds: 420,
    resolved_sample_size: 2,
    avg_disarm_seconds: 35,
    fastest_disarm_seconds: 12,
    disarm_sample_size: 6,
  };
}

export function assetCoverage() {
  const armed = assets.filter((a) => a.is_armed).length;
  return {
    total_assets: assets.length,
    armed_assets: armed,
    coverage_percent: assets.length === 0 ? 0 : Math.round((armed / assets.length) * 100),
  };
}

export function simulateIncident(): IncidentDetail {
  const asset = assets.find((a) => a.is_armed) ?? assets[0];
  const device = devices.find((d) => d.id === asset?.device_id) ?? devices[0];
  const id = nextId("incident");
  const incident: IncidentDetail = {
    id,
    created_at: iso(),
    updated_at: iso(),
    user_id: user.id,
    device_id: device?.id ?? "device-1",
    asset_id: asset?.id ?? null,
    title: `Unverified movement — ${asset?.name ?? "Guarded asset"}`,
    description: "Simulated event: sensor node reported sudden movement while armed.",
    status: "open",
    severity: "high",
    triggered_at: iso(),
    resolved_at: null,
    resolution_notes: null,
    timeline_events: [
      {
        id: nextId("evt"),
        incident_id: id,
        event_type: "sensor_event",
        description: "Movement detected by sensor node",
        actor: "device",
        event_metadata: null,
        occurred_at: iso(),
      },
      {
        id: nextId("evt"),
        incident_id: id,
        event_type: "incident_created",
        description: "Incident created from simulated event",
        actor: "system",
        event_metadata: null,
        occurred_at: iso(),
      },
    ],
    evidence_items: [
      {
        id: nextId("ev"),
        incident_id: id,
        type: "sensor_snapshot",
        url: null,
        content: "Accelerometer spike: 3.8g, duration 650ms",
        captured_at: iso(),
      },
    ],
  };
  incidents.unshift(incident);
  notifications.unshift({
    id: nextId("notif"),
    created_at: iso(),
    updated_at: iso(),
    user_id: user.id,
    type: "incident",
    title: "New incident detected",
    body: incident.title,
    data: { incident_id: incident.id },
    is_read: false,
  });
  return incident;
}

export const notifications: Notification[] = [
  {
    id: nextId("notif"),
    created_at: hoursAgo(3),
    updated_at: hoursAgo(3),
    user_id: user.id,
    type: "incident",
    title: "New incident detected",
    body: "Unverified movement — College Backpack",
    data: { incident_id: "incident-1" },
    is_read: false,
  },
  {
    id: nextId("notif"),
    created_at: hoursAgo(20),
    updated_at: hoursAgo(20),
    user_id: user.id,
    type: "achievement",
    title: "Achievement unlocked",
    body: "You earned \"Quick Resolver\" (+100 XP)",
    data: null,
    is_read: false,
  },
  {
    id: nextId("notif"),
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    user_id: user.id,
    type: "device_health",
    title: "Device signal degraded",
    body: "Backpack Node battery is running low",
    data: { device_id: "device-2" },
    is_read: true,
  },
  {
    id: nextId("notif"),
    created_at: daysAgo(5),
    updated_at: daysAgo(5),
    user_id: user.id,
    type: "challenge",
    title: "Challenge progress",
    body: "3 more days to complete \"14-Day Arming Streak\"",
    data: null,
    is_read: true,
  },
  {
    id: nextId("notif"),
    created_at: daysAgo(9),
    updated_at: daysAgo(9),
    user_id: user.id,
    type: "system",
    title: "Welcome to HosDost",
    body: "Pair your first sensor node to get started.",
    data: null,
    is_read: true,
  },
];

export function markNotificationRead(id: string): Notification {
  const n = notifications.find((x) => x.id === id);
  if (!n) throw new Error("Not found");
  n.is_read = true;
  n.updated_at = iso();
  return n;
}

export function markAllNotificationsRead(): Notification[] {
  notifications.forEach((n) => {
    n.is_read = true;
    n.updated_at = iso();
  });
  return notifications;
}

export { nextId, iso };
