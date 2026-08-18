import { ApiError } from "@/lib/api/client";
import * as store from "@/lib/demo/mockStore";
import type { Asset, AssetCategory, Device, Evidence, Incident, IncidentStatus } from "@/types/api";

const MOCK_DELAY_MS = 250;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

type Method = "GET" | "POST" | "PATCH" | "DELETE";

function notFound(): never {
  throw new ApiError("Not found", 404);
}

export async function mockRequest<T>(method: Method, fullPath: string, body?: unknown): Promise<T> {
  await delay();
  const [path, queryString] = fullPath.split("?");
  const query = new URLSearchParams(queryString ?? "");
  const segments = path.split("/").filter(Boolean);

  // /devices
  if (path === "/devices" && method === "GET") return store.state.devices as T;
  if (path === "/devices/pair" && method === "POST") {
    const b = body as { name: string; device_uid: string };
    const device: Device = {
      id: store.nextId("device"),
      created_at: store.iso(),
      updated_at: store.iso(),
      owner_id: store.state.user.id,
      name: b.name,
      device_uid: b.device_uid,
      status: "online",
      firmware_version: "1.4.2",
      last_seen_at: store.iso(),
      battery_percent: 100,
      signal_strength: 90,
    };
    store.state.devices.push(device);
    return device as T;
  }

  // /assets
  if (path === "/assets" && method === "GET") return store.state.assets as T;
  if (path === "/assets" && method === "POST") {
    const b = body as { name: string; category: AssetCategory };
    const asset: Asset = {
      id: store.nextId("asset"),
      created_at: store.iso(),
      updated_at: store.iso(),
      owner_id: store.state.user.id,
      device_id: null,
      name: b.name,
      category: b.category,
      description: null,
      photo_url: null,
      is_armed: false,
    };
    store.state.assets.push(asset);
    return asset as T;
  }
  if (segments[0] === "assets" && segments.length === 2) {
    const asset = store.state.assets.find((a) => a.id === segments[1]);
    if (!asset) notFound();
    if (method === "GET") return asset as T;
    if (method === "PATCH") {
      Object.assign(asset, body, { updated_at: store.iso() });
      return asset as T;
    }
    if (method === "DELETE") {
      const idx = store.state.assets.indexOf(asset);
      store.state.assets.splice(idx, 1);
      return undefined as T;
    }
  }

  // /incidents
  if (path === "/incidents" && method === "GET") {
    const status = query.get("status") as IncidentStatus | null;
    const list = status ? store.state.incidents.filter((i) => i.status === status) : store.state.incidents;
    return list as unknown as T;
  }
  if (segments[0] === "incidents" && segments.length === 2 && method === "GET") {
    const incident = store.state.incidents.find((i) => i.id === segments[1]);
    if (!incident) notFound();
    return incident as T;
  }
  if (segments[0] === "incidents" && segments[2] === "evidence" && method === "POST") {
    const incident = store.state.incidents.find((i) => i.id === segments[1]);
    if (!incident) notFound();
    const b = body as { type: Evidence["type"]; content?: string };
    const evidence: Evidence = {
      id: store.nextId("ev"),
      incident_id: incident.id,
      type: b.type,
      url: null,
      content: b.content ?? null,
      captured_at: store.iso(),
    };
    incident.evidence_items.push(evidence);
    return evidence as T;
  }
  if (segments[0] === "incidents" && segments[2] === "resolve" && method === "PATCH") {
    const incident = store.state.incidents.find((i) => i.id === segments[1]);
    if (!incident) notFound();
    const b = body as { status: IncidentStatus; resolution_notes?: string };
    incident.status = b.status;
    incident.resolution_notes = b.resolution_notes ?? null;
    incident.resolved_at = store.iso();
    incident.updated_at = store.iso();
    incident.timeline_events.push({
      id: store.nextId("evt"),
      incident_id: incident.id,
      event_type: "incident_resolved",
      description: b.status === "false_alarm" ? "Marked as false alarm" : "Incident resolved",
      actor: "user",
      event_metadata: null,
      occurred_at: store.iso(),
    });
    store.awardXp(b.status === "false_alarm" ? -10 : 50, b.status === "false_alarm" ? "False alarm reported" : "Resolved a case");
    if (b.status === "resolved") store.maybeUnlockQuickResolver();
    return incident as unknown as T;
  }

  // /demo
  if (path === "/demo/simulate-incident" && method === "POST") {
    return store.simulateIncident() as unknown as T;
  }
  if (path === "/demo/resolve-latest" && method === "POST") {
    return store.resolveLatestCase() as unknown as T;
  }
  if (path === "/demo/cycle-device" && method === "POST") {
    const b = (body as { device_id?: string } | undefined) ?? {};
    return store.cycleDeviceStatus(b.device_id) as unknown as T;
  }
  if (path === "/demo/add-xp" && method === "POST") {
    return store.awardXp(25, "Manual XP boost (demo)") as unknown as T;
  }
  if (path === "/demo/reset" && method === "POST") {
    store.resetDemo();
    return undefined as T;
  }

  // /notifications
  if (path === "/notifications" && method === "GET") return store.state.notifications as unknown as T;
  if (path === "/notifications/read-all" && method === "POST") {
    return store.markAllNotificationsRead() as unknown as T;
  }
  if (segments[0] === "notifications" && segments.length === 2 && method === "PATCH") {
    return store.markNotificationRead(segments[1]) as unknown as T;
  }

  // /auth
  if (path === "/auth/me" && method === "GET") return store.state.user as T;
  if (path === "/auth/me" && method === "PATCH") {
    Object.assign(store.state.user, body, { updated_at: store.iso() });
    return store.state.user as T;
  }
  if (path === "/auth/telegram/link-code" && method === "POST") {
    return store.telegramLinkCode() as T;
  }

  // /gamification
  if (path === "/gamification/security-score" && method === "GET") return store.state.securityScore as T;
  if (path === "/gamification/xp" && method === "GET") return store.state.xpTransactions as T;
  if (path === "/gamification/achievements" && method === "GET") return store.state.achievements as T;
  if (path === "/gamification/achievements/unlocked" && method === "GET") return store.state.unlockedAchievements as T;
  if (path === "/gamification/challenges" && method === "GET") return store.state.challenges as T;
  if (path === "/gamification/daily-check" && method === "GET") return store.getDailyCheck() as unknown as T;
  if (path === "/gamification/daily-check" && method === "POST") return store.completeDailyCheck() as unknown as T;
  if (path === "/gamification/weekly-summary" && method === "GET") return store.weeklySummary() as unknown as T;

  // /analytics
  if (path === "/analytics/summary" && method === "GET") return store.analyticsSummary() as T;
  if (path === "/analytics/incidents-trend" && method === "GET") {
    return store.analyticsTrend(Number(query.get("days") ?? 14)) as unknown as T;
  }
  if (path === "/analytics/response-times" && method === "GET") return store.responseTimes() as T;
  if (path === "/analytics/asset-coverage" && method === "GET") return store.assetCoverage() as T;
  if (path === "/analytics/security-heatmap" && method === "GET") {
    return store.securityHeatmap(Number(query.get("days") ?? 28)) as unknown as T;
  }
  if (path === "/analytics/alert-timeline" && method === "GET") return store.alertTimeline() as unknown as T;

  notFound();
}
