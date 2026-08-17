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
  if (path === "/devices" && method === "GET") return store.devices as T;
  if (path === "/devices/pair" && method === "POST") {
    const b = body as { name: string; device_uid: string };
    const device: Device = {
      id: store.nextId("device"),
      created_at: store.iso(),
      updated_at: store.iso(),
      owner_id: store.user.id,
      name: b.name,
      device_uid: b.device_uid,
      status: "online",
      firmware_version: "1.4.2",
      last_seen_at: store.iso(),
    };
    store.devices.push(device);
    return device as T;
  }

  // /assets
  if (path === "/assets" && method === "GET") return store.assets as T;
  if (path === "/assets" && method === "POST") {
    const b = body as { name: string; category: AssetCategory };
    const asset: Asset = {
      id: store.nextId("asset"),
      created_at: store.iso(),
      updated_at: store.iso(),
      owner_id: store.user.id,
      device_id: null,
      name: b.name,
      category: b.category,
      description: null,
      photo_url: null,
      is_armed: false,
    };
    store.assets.push(asset);
    return asset as T;
  }
  if (segments[0] === "assets" && segments.length === 2) {
    const asset = store.assets.find((a) => a.id === segments[1]);
    if (!asset) notFound();
    if (method === "GET") return asset as T;
    if (method === "PATCH") {
      Object.assign(asset, body, { updated_at: store.iso() });
      return asset as T;
    }
    if (method === "DELETE") {
      const idx = store.assets.indexOf(asset);
      store.assets.splice(idx, 1);
      return undefined as T;
    }
  }

  // /incidents
  if (path === "/incidents" && method === "GET") {
    const status = query.get("status") as IncidentStatus | null;
    const list = status ? store.incidents.filter((i) => i.status === status) : store.incidents;
    return list as unknown as T;
  }
  if (segments[0] === "incidents" && segments.length === 2 && method === "GET") {
    const incident = store.incidents.find((i) => i.id === segments[1]);
    if (!incident) notFound();
    return incident as T;
  }
  if (segments[0] === "incidents" && segments[2] === "evidence" && method === "POST") {
    const incident = store.incidents.find((i) => i.id === segments[1]);
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
    const incident = store.incidents.find((i) => i.id === segments[1]);
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
    return incident as unknown as T;
  }

  // /demo
  if (path === "/demo/simulate-incident" && method === "POST") {
    return store.simulateIncident() as unknown as T;
  }

  // /notifications
  if (path === "/notifications" && method === "GET") return store.notifications as unknown as T;
  if (path === "/notifications/read-all" && method === "POST") {
    return store.markAllNotificationsRead() as unknown as T;
  }
  if (segments[0] === "notifications" && segments.length === 2 && method === "PATCH") {
    return store.markNotificationRead(segments[1]) as unknown as T;
  }

  // /auth
  if (path === "/auth/me" && method === "GET") return store.user as T;
  if (path === "/auth/me" && method === "PATCH") {
    Object.assign(store.user, body, { updated_at: store.iso() });
    return store.user as T;
  }
  if (path === "/auth/telegram/link-code" && method === "POST") {
    return store.telegramLinkCode() as T;
  }

  // /gamification
  if (path === "/gamification/security-score" && method === "GET") return store.securityScore as T;
  if (path === "/gamification/xp" && method === "GET") return store.xpTransactions as T;
  if (path === "/gamification/achievements" && method === "GET") return store.achievements as T;
  if (path === "/gamification/achievements/unlocked" && method === "GET") return store.unlockedAchievements as T;
  if (path === "/gamification/challenges" && method === "GET") return store.challenges as T;

  // /analytics
  if (path === "/analytics/summary" && method === "GET") return store.analyticsSummary() as T;
  if (path === "/analytics/incidents-trend" && method === "GET") {
    return store.analyticsTrend(Number(query.get("days") ?? 14)) as unknown as T;
  }
  if (path === "/analytics/response-times" && method === "GET") return store.responseTimes() as T;
  if (path === "/analytics/asset-coverage" && method === "GET") return store.assetCoverage() as T;

  notFound();
}
