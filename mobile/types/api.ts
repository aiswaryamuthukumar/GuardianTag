export type GuardianLevel = "rookie" | "watchman" | "guardian" | "sentinel" | "hostel_protector";
export type DeviceStatus = "unpaired" | "online" | "offline" | "degraded";
export type AssetCategory = "bag" | "laptop" | "document" | "other";
export type SensorEventType = "movement" | "hall_trigger" | "dual_verified" | "disarmed" | "heartbeat";
export type IncidentStatus = "open" | "investigating" | "resolved" | "false_alarm";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type TimelineActor = "system" | "user" | "device";
export type EvidenceType = "photo" | "sensor_snapshot" | "note";
export type NotificationType = "incident" | "achievement" | "challenge" | "device_health" | "system";

export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  clerk_user_id: string;
  email: string;
  full_name: string;
  room_number: string | null;
  phone: string | null;
  avatar_url: string | null;
  level: GuardianLevel;
  telegram_chat_id: string | null;
}

export interface TelegramLinkCode {
  link_code: string;
  deep_link: string | null;
}

export interface Device {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  name: string;
  device_uid: string;
  status: DeviceStatus;
  firmware_version: string | null;
  last_seen_at: string | null;
}

export interface Asset {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  device_id: string | null;
  name: string;
  category: AssetCategory;
  description: string | null;
  photo_url: string | null;
  is_armed: boolean;
}

export interface SensorEvent {
  id: string;
  device_id: string;
  asset_id: string | null;
  event_type: SensorEventType;
  payload: Record<string, unknown> | null;
  device_timestamp: string;
  received_at: string;
}

export interface IncidentTimelineEvent {
  id: string;
  incident_id: string;
  event_type: string;
  description: string;
  actor: TimelineActor;
  event_metadata: Record<string, unknown> | null;
  occurred_at: string;
}

export interface Evidence {
  id: string;
  incident_id: string;
  type: EvidenceType;
  url: string | null;
  content: string | null;
  captured_at: string;
}

export interface Incident {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  device_id: string;
  asset_id: string | null;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  triggered_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface IncidentDetail extends Incident {
  timeline_events: IncidentTimelineEvent[];
  evidence_items: Evidence[];
}

export interface Notification {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
}

export interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string | null;
  xp_reward: number;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  unlocked_at: string;
}

export interface Challenge {
  id: string;
  key: string;
  title: string;
  description: string;
  xp_reward: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
}

export interface SecurityScore {
  score: number;
  level: GuardianLevel;
  streak_days: number;
  last_calculated_at: string;
}

export interface AnalyticsSummary {
  total_devices: number;
  total_assets: number;
  open_incidents: number;
  resolved_incidents: number;
  false_alarms: number;
}

export interface DailyIncidentCountApi {
  date: string;
  count: number;
}

export interface ResponseTimes {
  avg_resolution_seconds: number | null;
  resolved_sample_size: number;
  avg_disarm_seconds: number | null;
  fastest_disarm_seconds: number | null;
  disarm_sample_size: number;
}

export interface AssetCoverage {
  total_assets: number;
  armed_assets: number;
  coverage_percent: number;
}
