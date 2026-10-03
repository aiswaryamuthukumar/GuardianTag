// TS mirrors of the backend's Pydantic schemas (backend/app/schemas).

export type GuardianLevel = "rookie" | "watchman" | "guardian" | "sentinel" | "hostel_protector";
export type UserRole = "student" | "warden";
export type DeviceStatus = "unpaired" | "online" | "offline" | "degraded";
export type AssetCategory = "bag" | "laptop" | "document" | "other";
export type SensorEventType = "movement" | "hall_trigger" | "dual_verified" | "disarmed" | "heartbeat";
export type IncidentStatus = "open" | "investigating" | "resolved" | "false_alarm";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type TimelineActor = "system" | "user" | "device";
export type EvidenceType = "photo" | "sensor_snapshot" | "note";
export type NotificationType = "incident" | "achievement" | "challenge" | "device_health" | "system";

interface Timestamped {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface User extends Timestamped {
  email: string;
  full_name: string;
  room_number: string | null;
  hostel_block: string | null;
  phone: string | null;
  avatar_url: string | null;
  level: GuardianLevel;
  role: UserRole;
  telegram_chat_id: string | null;
  notify_push: boolean;
  notify_telegram: boolean;
  quiet_start: string | null;
  quiet_end: string | null;
  has_push_token: boolean;
}

export type UserUpdate = Partial<
  Pick<
    User,
    | "full_name"
    | "room_number"
    | "hostel_block"
    | "phone"
    | "avatar_url"
    | "notify_push"
    | "notify_telegram"
    | "quiet_start"
    | "quiet_end"
  >
> & { expo_push_token?: string };

export interface WardenContact {
  full_name: string;
  phone: string | null;
  hostel_block: string | null;
}

export interface TelegramLinkCode {
  link_code: string;
  deep_link: string | null;
}

export interface Device extends Timestamped {
  owner_id: string;
  name: string;
  device_uid: string;
  status: DeviceStatus;
  firmware_version: string | null;
  last_seen_at: string | null;
  battery_percent: number | null;
  signal_strength: number | null; // 0-100 from the last heartbeat's Wi-Fi RSSI
}

export interface DeviceHealth {
  id: string;
  device_id: string;
  status: DeviceStatus;
  battery_level: number | null;
  wifi_rssi: number | null;
  uptime_seconds: number | null;
  firmware_version: string | null;
  recorded_at: string;
}

export interface Asset extends Timestamped {
  owner_id: string;
  device_id: string | null;
  name: string;
  category: AssetCategory;
  description: string | null;
  photo_url: string | null;
  is_armed: boolean;
  location: string | null;
}

export type AssetInput = Partial<
  Pick<Asset, "name" | "category" | "description" | "photo_url" | "device_id" | "is_armed" | "location">
>;

export interface ArmSchedule extends Timestamped {
  asset_id: string;
  days_mask: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  enabled: boolean;
}

export interface SensorEvent {
  id: string;
  device_id: string;
  asset_id: string | null;
  event_type: SensorEventType;
  payload: { ignored?: string; clock_skew_seconds?: number; [key: string]: unknown } | null;
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

export interface Incident extends Timestamped {
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

export interface Notification extends Timestamped {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  is_read: boolean;
}

export type NoticePriority = "normal" | "urgent";

export interface Notice extends Timestamped {
  warden_id: string | null;
  author_name: string | null;
  hostel_block: string | null;
  title: string;
  body: string;
  priority: NoticePriority;
  is_read: boolean; // for the student viewing it
  recipients: number; // for wardens: delivered to
  read_count: number; // for wardens: read by
}

export interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface ProgressItem {
  kind: "achievement" | "challenge";
  key: string;
  title: string;
  description: string;
  icon: string | null;
  xp_reward: number;
  progress: number;
  target: number;
  completed: boolean;
  completed_at: string | null;
}

export interface LevelInfo {
  score: number;
  level: GuardianLevel;
  streak_days: number;
  level_floor: number;
  next_level: GuardianLevel | null;
  next_level_at: number | null;
}

export interface AnalyticsSummary {
  total_devices: number;
  total_assets: number;
  open_incidents: number;
  resolved_incidents: number;
  false_alarms: number;
}

export interface DailyIncidentCount {
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

export interface Heatmap {
  days: number;
  cells: number[][]; // [weekday 0=Mon][hour]
  peak_weekday: number | null;
  peak_hour: number | null;
}

export interface EventMixItem {
  event_type: SensorEventType;
  count: number;
}

export interface DailyCheck {
  done_today: boolean;
  streak_days: number;
  xp_reward: number;
}

export interface WeeklySummary {
  xp_gained: number;
  streak_days: number;
  alerts: number;
  resolved_cases: number;
  protected_devices: number;
}

export interface HeatmapDay {
  date: string;
  alert: boolean;
  resolved: boolean;
  checked: boolean;
}

export interface AlertTimelineEntry {
  id: string;
  triggered_at: string;
  device_name: string;
  asset_name: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
}

export interface SimulateResult {
  ignored: boolean;
  incident: Incident | null;
}

// --- Warden ---

export interface WardenIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  triggered_at: string;
  resolved_at: string | null;
  student_id: string;
  student_name: string;
  room_number: string | null;
  hostel_block: string | null;
  phone: string | null;
  device_name: string;
  asset_name: string | null;
}

export type RoomState = "alert" | "offline" | "armed" | "idle";

export interface Room {
  hostel_block: string | null;
  room_number: string | null;
  state: RoomState;
  students: { id: string; full_name: string; phone: string | null }[];
  devices: { id: string; name: string; status: DeviceStatus; last_seen_at: string | null }[];
  armed_assets: number;
  total_assets: number;
  open_incidents: number;
}

export interface WardenAnalytics {
  students: number;
  devices_total: number;
  devices_online: number;
  open_incidents: number;
  incidents_30d: number;
  false_alarm_rate: number;
  avg_response_seconds: number | null;
  by_block: { hostel_block: string; incidents: number }[];
  by_hour: number[];
}

// --- Realtime (/ws/me) ---

export type RealtimeMessage =
  | { type: "sensor_event"; event: SensorEvent }
  | { type: "device_health"; health: DeviceHealth }
  | { type: "device_status"; device_id: string; status: DeviceStatus }
  | { type: "incident_created" | "incident_updated"; incident: Incident }
  | { type: "notification"; notification: Notification }
  | { type: "asset_updated"; asset: Asset }
  | { type: "notice"; notice: Notice }
  | { type: "notice_read"; notice_id: string; recipients: number; read_count: number }
  | { type: "notice_deleted"; notice_id: string };
