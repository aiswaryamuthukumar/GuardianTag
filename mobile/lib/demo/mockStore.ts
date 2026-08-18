import type {
  Achievement,
  AlertTimelineEntry,
  Asset,
  Challenge,
  Device,
  Evidence,
  GuardianLevel,
  HeatmapDay,
  Incident,
  IncidentDetail,
  IncidentTimelineEvent,
  Notification,
  SecurityScore,
  TelegramLinkCode,
  User,
  UserAchievement,
  WeeklySummary,
  XPTransaction,
} from "@/types/api";

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${seq++}`;

const now = () => new Date();
const hoursAgo = (h: number) => new Date(now().getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
const iso = () => now().toISOString();
const dayKey = (d: string) => d.slice(0, 10);

export const levelLabels: Record<GuardianLevel, string> = {
  rookie_guardian: "Rookie Guardian",
  alert_guardian: "Alert Guardian",
  protector: "Protector",
  guardian_pro: "Guardian Pro",
};

export const guardianLevelOrder: GuardianLevel[] = ["rookie_guardian", "alert_guardian", "protector", "guardian_pro"];

const achievementCatalog: Achievement[] = [
  { id: "ach-1", key: "first_arm", name: "First Line of Defense", description: "Arm your first asset.", icon: null, xp_reward: 20 },
  { id: "ach-2", key: "week_streak", name: "Week-Long Watch", description: "Stay armed for 7 days.", icon: null, xp_reward: 50 },
  { id: "ach-3", key: "quick_resolver", name: "Quick Resolver", description: "Resolve a case in under 5 minutes.", icon: null, xp_reward: 100 },
  { id: "ach-4", key: "fully_armed", name: "Fully Armed", description: "Arm every asset at once.", icon: null, xp_reward: 75 },
  { id: "ach-5", key: "protector_rank", name: "Protector", description: "Reach Protector level.", icon: null, xp_reward: 200 },
];

export type AccountId = "aiswarya" | "student";

export const DEMO_ACCOUNTS: Record<string, { password: string; id: AccountId }> = {
  "aiswarya@hosdost.demo": { password: "demo123", id: "aiswarya" },
  "student@hosdost.demo": { password: "demo123", id: "student" },
};

function buildAccount(id: AccountId) {
  const isAiswarya = id === "aiswarya";

  const user: User = {
    id: `demo-${id}`,
    created_at: daysAgo(90),
    updated_at: iso(),
    clerk_user_id: `demo-${id}`,
    email: isAiswarya ? "aiswarya@hosdost.demo" : "student@hosdost.demo",
    full_name: isAiswarya ? "Aiswarya M" : "Student Guardian",
    room_number: isAiswarya ? "A101" : "B204",
    phone: null,
    avatar_url: null,
    level: isAiswarya ? "protector" : "rookie_guardian",
    telegram_chat_id: null,
  };

  const devices: Device[] = isAiswarya
    ? [
        { id: "device-1", created_at: daysAgo(60), updated_at: hoursAgo(1), owner_id: user.id, name: "Room A101 Node", device_uid: "esp32-aa:bb:cc", status: "online", firmware_version: "1.4.2", last_seen_at: hoursAgo(0), battery_percent: 92, signal_strength: 88 },
        { id: "device-2", created_at: daysAgo(30), updated_at: hoursAgo(6), owner_id: user.id, name: "Backpack Node", device_uid: "esp32-dd:ee:ff", status: "degraded", firmware_version: "1.3.9", last_seen_at: hoursAgo(5), battery_percent: 34, signal_strength: 41 },
        { id: "device-3", created_at: daysAgo(14), updated_at: hoursAgo(2), owner_id: user.id, name: "Laptop Node", device_uid: "esp32-11:22:33", status: "online", firmware_version: "1.4.2", last_seen_at: hoursAgo(1), battery_percent: 78, signal_strength: 95 },
      ]
    : [
        { id: "device-1", created_at: daysAgo(20), updated_at: hoursAgo(3), owner_id: user.id, name: "Room B204 Node", device_uid: "esp32-bb:cc:dd", status: "online", firmware_version: "1.4.2", last_seen_at: hoursAgo(1), battery_percent: 65, signal_strength: 70 },
        { id: "device-2", created_at: daysAgo(10), updated_at: daysAgo(1), owner_id: user.id, name: "Bag Node", device_uid: "esp32-ee:ff:00", status: "offline", firmware_version: "1.3.5", last_seen_at: daysAgo(1), battery_percent: 12, signal_strength: 0 },
      ];

  const assets: Asset[] = isAiswarya
    ? [
        { id: "asset-1", created_at: daysAgo(60), updated_at: hoursAgo(2), owner_id: user.id, device_id: "device-2", name: "College Backpack", category: "bag", description: "Blue backpack, laptop pocket.", photo_url: null, is_armed: true },
        { id: "asset-2", created_at: daysAgo(45), updated_at: hoursAgo(10), owner_id: user.id, device_id: "device-3", name: "MacBook Air", category: "laptop", description: "Kept on the desk.", photo_url: null, is_armed: true },
        { id: "asset-3", created_at: daysAgo(20), updated_at: daysAgo(1), owner_id: user.id, device_id: null, name: "Passport & Documents", category: "document", description: "Passport and ID cards.", photo_url: null, is_armed: true },
      ]
    : [
        { id: "asset-1", created_at: daysAgo(15), updated_at: hoursAgo(4), owner_id: user.id, device_id: "device-2", name: "Study Bag", category: "bag", description: "Books and charger.", photo_url: null, is_armed: false },
        { id: "asset-2", created_at: daysAgo(8), updated_at: daysAgo(2), owner_id: user.id, device_id: "device-1", name: "Tablet", category: "other", description: "Kept in the room.", photo_url: null, is_armed: false },
      ];

  const timelineFor = (incidentId: string, base: string): IncidentTimelineEvent[] => [
    { id: nextId("evt"), incident_id: incidentId, event_type: "sensor_event", description: "Movement detected", actor: "device", event_metadata: null, occurred_at: base },
    { id: nextId("evt"), incident_id: incidentId, event_type: "incident_created", description: "Incident created", actor: "system", event_metadata: null, occurred_at: base },
  ];

  const evidenceFor = (incidentId: string, base: string): Evidence[] => [
    { id: nextId("ev"), incident_id: incidentId, type: "sensor_snapshot", url: null, content: "Accelerometer spike: 4.2g, duration 800ms", captured_at: base },
  ];

  const incidents: IncidentDetail[] = isAiswarya
    ? [
        {
          id: "incident-1", created_at: hoursAgo(3), updated_at: hoursAgo(3), user_id: user.id, device_id: "device-2", asset_id: "asset-1",
          title: "College Backpack moved", description: "Movement detected while armed.", status: "open", severity: "high",
          triggered_at: hoursAgo(3), resolved_at: null, resolution_notes: null,
          timeline_events: timelineFor("incident-1", hoursAgo(3)), evidence_items: evidenceFor("incident-1", hoursAgo(3)),
        },
        {
          id: "incident-2", created_at: daysAgo(3), updated_at: daysAgo(3), user_id: user.id, device_id: "device-3", asset_id: "asset-2",
          title: "MacBook Air moved", description: "Roommate moved it to charge.", status: "false_alarm", severity: "low",
          triggered_at: daysAgo(3), resolved_at: daysAgo(3), resolution_notes: "Confirmed with roommate. No theft.",
          timeline_events: timelineFor("incident-2", daysAgo(3)), evidence_items: [],
        },
        {
          id: "incident-3", created_at: daysAgo(9), updated_at: daysAgo(9), user_id: user.id, device_id: "device-2", asset_id: "asset-1",
          title: "College Backpack alert confirmed", description: "Two sensors triggered within seconds.", status: "resolved", severity: "critical",
          triggered_at: daysAgo(9), resolved_at: daysAgo(9), resolution_notes: "Warden moved the bag during a routine check. Verified on CCTV.",
          timeline_events: timelineFor("incident-3", daysAgo(9)), evidence_items: evidenceFor("incident-3", daysAgo(9)),
        },
      ]
    : [];

  const securityScore: SecurityScore = isAiswarya
    ? { score: 1240, level: "protector", streak_days: 7, last_calculated_at: iso() }
    : { score: 420, level: "rookie_guardian", streak_days: 2, last_calculated_at: iso() };

  const xpTransactions: XPTransaction[] = isAiswarya
    ? [
        { id: nextId("xp"), amount: 15, reason: "Today's Guardian Check", reference_type: null, reference_id: null, created_at: hoursAgo(20) },
        { id: nextId("xp"), amount: 50, reason: "Armed all assets before leaving", reference_type: null, reference_id: null, created_at: hoursAgo(30) },
        { id: nextId("xp"), amount: 100, reason: "Resolved incident quickly", reference_type: "incident", reference_id: "incident-3", created_at: daysAgo(9) },
        { id: nextId("xp"), amount: -20, reason: "False alarm reported", reference_type: "incident", reference_id: "incident-2", created_at: daysAgo(3) },
        { id: nextId("xp"), amount: 30, reason: "7-day arming streak", reference_type: null, reference_id: null, created_at: daysAgo(5) },
      ]
    : [
        { id: nextId("xp"), amount: 15, reason: "Today's Guardian Check", reference_type: null, reference_id: null, created_at: hoursAgo(18) },
        { id: nextId("xp"), amount: 20, reason: "Armed your first asset", reference_type: null, reference_id: null, created_at: daysAgo(2) },
        { id: nextId("xp"), amount: 10, reason: "2-day streak", reference_type: null, reference_id: null, created_at: daysAgo(1) },
      ];

  const unlockedAchievements: UserAchievement[] = isAiswarya
    ? [
        { id: nextId("uach"), achievement: achievementCatalog[0], unlocked_at: daysAgo(55) },
        { id: nextId("uach"), achievement: achievementCatalog[1], unlocked_at: daysAgo(20) },
        { id: nextId("uach"), achievement: achievementCatalog[2], unlocked_at: daysAgo(9) },
      ]
    : [{ id: nextId("uach"), achievement: achievementCatalog[0], unlocked_at: daysAgo(1) }];

  const challenges: Challenge[] = [
    { id: "chal-1", key: "arm_streak_14", title: "14-Day Arming Streak", description: "Arm an asset every day for 14 days.", xp_reward: 80, is_active: true, start_at: daysAgo(2), end_at: daysAgo(-12) },
    { id: "chal-2", key: "zero_false_alarms", title: "Zero False Alarms", description: "No false alarms for a week.", xp_reward: 60, is_active: true, start_at: daysAgo(1), end_at: daysAgo(-6) },
    { id: "chal-3", key: "pair_second_device", title: "Double Coverage", description: "Pair a second device.", xp_reward: 40, is_active: !isAiswarya, start_at: daysAgo(40), end_at: daysAgo(10) },
  ];

  const notifications: Notification[] = isAiswarya
    ? [
        { id: nextId("notif"), created_at: hoursAgo(3), updated_at: hoursAgo(3), user_id: user.id, type: "incident", title: "New incident", body: "College Backpack moved", data: { incident_id: "incident-1" }, is_read: false },
        { id: nextId("notif"), created_at: hoursAgo(20), updated_at: hoursAgo(20), user_id: user.id, type: "achievement", title: "Guardian check complete", body: "+15 XP, 7-day streak", data: null, is_read: false },
        { id: nextId("notif"), created_at: daysAgo(2), updated_at: daysAgo(2), user_id: user.id, type: "device_health", title: "Device status", body: "Backpack Node battery is low", data: { device_id: "device-2" }, is_read: true },
        { id: nextId("notif"), created_at: daysAgo(5), updated_at: daysAgo(5), user_id: user.id, type: "challenge", title: "Challenge progress", body: "3 days left: 14-Day Arming Streak", data: null, is_read: true },
        { id: nextId("notif"), created_at: daysAgo(9), updated_at: daysAgo(9), user_id: user.id, type: "system", title: "Welcome to HosDost", body: "Pair your first device to start.", data: null, is_read: true },
      ]
    : [
        { id: nextId("notif"), created_at: hoursAgo(18), updated_at: hoursAgo(18), user_id: user.id, type: "achievement", title: "Guardian check complete", body: "+15 XP, 2-day streak", data: null, is_read: false },
        { id: nextId("notif"), created_at: daysAgo(1), updated_at: daysAgo(1), user_id: user.id, type: "achievement", title: "Achievement unlocked", body: "First Line of Defense, +20 XP", data: null, is_read: false },
        { id: nextId("notif"), created_at: daysAgo(2), updated_at: daysAgo(2), user_id: user.id, type: "system", title: "Welcome to HosDost", body: "Pair your first device to start.", data: null, is_read: true },
      ];

  const dailyCheck = { done_today: false, streak_days: securityScore.streak_days, xp_reward: 15 };

  return {
    accountId: id, user, devices, assets, incidents, securityScore, xpTransactions,
    achievements: achievementCatalog, unlockedAchievements, challenges, notifications, dailyCheck,
  };
}

type AccountData = ReturnType<typeof buildAccount>;
export const state: AccountData = buildAccount("aiswarya");

export function switchAccount(id: AccountId) {
  Object.assign(state, buildAccount(id));
}

export function resetDemo() {
  Object.assign(state, buildAccount(state.accountId));
}

function levelForScore(score: number): GuardianLevel {
  if (score >= 2000) return "guardian_pro";
  if (score >= 1000) return "protector";
  if (score >= 500) return "alert_guardian";
  return "rookie_guardian";
}

function pushNotification(type: Notification["type"], title: string, body: string, data: Record<string, unknown> | null = null) {
  state.notifications.unshift({
    id: nextId("notif"),
    created_at: iso(),
    updated_at: iso(),
    user_id: state.user.id,
    type,
    title,
    body,
    data,
    is_read: false,
  });
}

let lastUnlock: { type: "level" | "achievement"; label: string } | null = null;
export function takeLastUnlock() {
  const u = lastUnlock;
  lastUnlock = null;
  return u;
}

export function awardXp(amount: number, reason: string) {
  state.securityScore.score = Math.max(0, state.securityScore.score + amount);
  state.xpTransactions.unshift({ id: nextId("xp"), amount, reason, reference_type: null, reference_id: null, created_at: iso() });

  const newLevel = levelForScore(state.securityScore.score);
  if (newLevel !== state.securityScore.level) {
    state.securityScore.level = newLevel;
    state.user.level = newLevel;
    pushNotification("achievement", "Level up", `You reached ${levelLabels[newLevel]}`);
    lastUnlock = { type: "level", label: levelLabels[newLevel] };
    if (newLevel === "protector" && !state.unlockedAchievements.some((u) => u.achievement.id === "ach-5")) {
      state.unlockedAchievements.push({ id: nextId("uach"), achievement: achievementCatalog[4], unlocked_at: iso() });
    }
  }
  return state.securityScore;
}

export function maybeUnlockQuickResolver() {
  if (!state.unlockedAchievements.some((u) => u.achievement.id === "ach-3")) {
    state.unlockedAchievements.push({ id: nextId("uach"), achievement: achievementCatalog[2], unlocked_at: iso() });
    lastUnlock = { type: "achievement", label: achievementCatalog[2].name };
  }
}

export function resolveLatestCase() {
  const incident = state.incidents.find((i) => i.status === "open" || i.status === "investigating");
  if (!incident) return null;
  incident.status = "resolved";
  incident.resolved_at = iso();
  incident.updated_at = iso();
  incident.resolution_notes = "Resolved from Demo Controls.";
  incident.timeline_events.push({
    id: nextId("evt"), incident_id: incident.id, event_type: "incident_resolved",
    description: "Incident resolved", actor: "user", event_metadata: null, occurred_at: iso(),
  });
  awardXp(50, "Resolved a case");
  pushNotification("incident", "Case resolved", incident.title, { incident_id: incident.id });
  maybeUnlockQuickResolver();
  return incident;
}

export function cycleDeviceStatus(deviceId?: string) {
  const device = state.devices.find((d) => d.id === deviceId) ?? state.devices[0];
  if (!device) return null;
  const order: Device["status"][] = ["online", "degraded", "offline"];
  const next = order[(order.indexOf(device.status) + 1) % order.length];
  device.status = next;
  device.signal_strength = next === "online" ? 90 : next === "degraded" ? 40 : 0;
  if (next === "offline") device.battery_percent = Math.max(5, (device.battery_percent ?? 50) - 10);
  device.updated_at = iso();
  if (next !== "offline") device.last_seen_at = iso();
  pushNotification("device_health", "Device status", `${device.name} is now ${next}`, { device_id: device.id });
  return device;
}

export function telegramLinkCode(): TelegramLinkCode {
  state.user.telegram_chat_id = state.user.telegram_chat_id ?? "demo-telegram-chat";
  return { link_code: "DEMO-482913", deep_link: null };
}

export function analyticsSummary() {
  return {
    total_devices: state.devices.length,
    total_assets: state.assets.length,
    open_incidents: state.incidents.filter((i) => i.status === "open" || i.status === "investigating").length,
    resolved_incidents: state.incidents.filter((i) => i.status === "resolved").length,
    false_alarms: state.incidents.filter((i) => i.status === "false_alarm").length,
  };
}

export function analyticsTrend(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const dayIndex = days - 1 - i;
    const date = dayKey(new Date(now().getTime() - dayIndex * 24 * 60 * 60 * 1000).toISOString());
    const count = state.incidents.filter((inc) => dayKey(inc.triggered_at) === date).length;
    return { date, count };
  });
}

export function responseTimes() {
  return {
    avg_resolution_seconds: state.incidents.length ? 420 : null,
    resolved_sample_size: state.incidents.filter((i) => i.status === "resolved").length,
    avg_disarm_seconds: 35,
    fastest_disarm_seconds: 12,
    disarm_sample_size: state.assets.filter((a) => a.is_armed).length * 2,
  };
}

export function assetCoverage() {
  const armed = state.assets.filter((a) => a.is_armed).length;
  return {
    total_assets: state.assets.length,
    armed_assets: armed,
    coverage_percent: state.assets.length === 0 ? 0 : Math.round((armed / state.assets.length) * 100),
  };
}

export function weeklySummary(): WeeklySummary {
  const weekAgo = daysAgo(7);
  const xpGained = state.xpTransactions.filter((t) => t.created_at >= weekAgo).reduce((sum, t) => sum + t.amount, 0);
  return {
    xp_gained: xpGained,
    streak_days: state.securityScore.streak_days,
    alerts: state.incidents.filter((i) => i.triggered_at >= weekAgo).length,
    resolved_cases: state.incidents.filter((i) => i.status === "resolved" && (i.resolved_at ?? "") >= weekAgo).length,
    protected_devices: state.assets.filter((a) => a.is_armed).length,
  };
}

export function securityHeatmap(days = 28): HeatmapDay[] {
  return Array.from({ length: days }, (_, i) => {
    const dayIndex = days - 1 - i;
    const date = dayKey(new Date(now().getTime() - dayIndex * 24 * 60 * 60 * 1000).toISOString());
    const alert = state.incidents.some((inc) => dayKey(inc.triggered_at) === date);
    const resolved = state.incidents.some((inc) => inc.resolved_at && dayKey(inc.resolved_at) === date);
    const checked = dayIndex < state.securityScore.streak_days;
    return { date, alert, resolved, checked };
  });
}

export function alertTimeline(): AlertTimelineEntry[] {
  return [...state.incidents]
    .sort((a, b) => (a.triggered_at < b.triggered_at ? 1 : -1))
    .map((inc) => ({
      id: inc.id,
      triggered_at: inc.triggered_at,
      device_name: state.devices.find((d) => d.id === inc.device_id)?.name ?? "Unknown device",
      severity: inc.severity,
      status: inc.status,
    }));
}

export function getDailyCheck() {
  return state.dailyCheck;
}

export function completeDailyCheck() {
  if (state.dailyCheck.done_today) return state.dailyCheck;
  state.dailyCheck.done_today = true;
  state.dailyCheck.streak_days += 1;
  state.securityScore.streak_days = state.dailyCheck.streak_days;
  awardXp(state.dailyCheck.xp_reward, "Today's Guardian Check");
  pushNotification("achievement", "Guardian check complete", `+${state.dailyCheck.xp_reward} XP · ${state.dailyCheck.streak_days}-day streak`);
  return state.dailyCheck;
}

export function simulateIncident(): IncidentDetail {
  const asset = state.assets.find((a) => a.is_armed) ?? state.assets[0];
  const device = state.devices.find((d) => d.id === asset?.device_id) ?? state.devices[0];
  const id = nextId("incident");
  const incident: IncidentDetail = {
    id,
    created_at: iso(),
    updated_at: iso(),
    user_id: state.user.id,
    device_id: device?.id ?? "device-1",
    asset_id: asset?.id ?? null,
    title: `${asset?.name ?? "Guarded asset"} moved`,
    description: "Test alert. Movement detected while armed.",
    status: "open",
    severity: "high",
    triggered_at: iso(),
    resolved_at: null,
    resolution_notes: null,
    timeline_events: [
      { id: nextId("evt"), incident_id: id, event_type: "sensor_event", description: "Movement detected", actor: "device", event_metadata: null, occurred_at: iso() },
      { id: nextId("evt"), incident_id: id, event_type: "incident_created", description: "Incident created", actor: "system", event_metadata: null, occurred_at: iso() },
    ],
    evidence_items: [
      { id: nextId("ev"), incident_id: id, type: "sensor_snapshot", url: null, content: "Accelerometer spike: 3.8g, duration 650ms", captured_at: iso() },
    ],
  };
  state.incidents.unshift(incident);
  state.notifications.unshift({
    id: nextId("notif"),
    created_at: iso(),
    updated_at: iso(),
    user_id: state.user.id,
    type: "incident",
    title: "New incident detected",
    body: incident.title,
    data: { incident_id: incident.id },
    is_read: false,
  });
  return incident;
}

export function markNotificationRead(id: string): Notification {
  const n = state.notifications.find((x) => x.id === id);
  if (!n) throw new Error("Not found");
  n.is_read = true;
  n.updated_at = iso();
  return n;
}

export function markAllNotificationsRead(): Notification[] {
  state.notifications.forEach((n) => {
    n.is_read = true;
    n.updated_at = iso();
  });
  return state.notifications;
}

export { nextId, iso };
