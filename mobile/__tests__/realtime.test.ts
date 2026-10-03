import { matchesFilter } from "@/src/features/activity/api";
import { apiClient, fileUrl } from "@/src/lib/api/client";
import { daysFromMask, signalLabel, timeAgo } from "@/src/lib/format";
import type { SensorEvent } from "@/src/types/api";

const event: SensorEvent = {
  id: "e1",
  device_id: "d1",
  asset_id: "a1",
  event_type: "dual_verified",
  payload: null,
  device_timestamp: "2026-09-29T10:00:00Z",
  received_at: "2026-09-29T10:00:00Z",
};

describe("live event routing", () => {
  it("drops a live event only into lists whose filter it matches", () => {
    expect(matchesFilter(event, {})).toBe(true);
    expect(matchesFilter(event, { device_id: "d1", event_type: "dual_verified" })).toBe(true);
    expect(matchesFilter(event, { device_id: "other" })).toBe(false);
    expect(matchesFilter(event, { asset_id: "other" })).toBe(false);
    expect(matchesFilter(event, { event_type: "movement" })).toBe(false);
  });
});

describe("format helpers", () => {
  const now = Date.parse("2026-09-29T10:00:00Z");

  it("timeAgo ticks through seconds, minutes, hours and days", () => {
    expect(timeAgo(null)).toBe("never");
    expect(timeAgo("2026-09-29T09:59:58Z", now)).toBe("just now");
    expect(timeAgo("2026-09-29T09:59:18Z", now)).toBe("42s ago");
    expect(timeAgo("2026-09-29T09:55:00Z", now)).toBe("5m ago");
    expect(timeAgo("2026-09-29T07:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2026-09-27T10:00:00Z", now)).toBe("2d ago");
  });

  it("describes schedule day masks (bit 0 = Monday)", () => {
    expect(daysFromMask(0b1111111)).toBe("Every day");
    expect(daysFromMask(0b0011111)).toBe("Weekdays");
    expect(daysFromMask(0b1100000)).toBe("Weekends");
    expect(daysFromMask(0b0000101)).toBe("Mon, Wed");
  });

  it("labels Wi-Fi strength", () => {
    expect(signalLabel(-50)).toBe("Excellent");
    expect(signalLabel(-70)).toBe("Fair");
    expect(signalLabel(-85)).toBe("Weak");
    expect(signalLabel(null)).toBe("Unknown");
  });
});

describe("api client", () => {
  afterEach(() => jest.restoreAllMocks());

  it("surfaces FastAPI's detail message instead of raw JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => JSON.stringify({ detail: "Warden access only" }),
    }) as unknown as typeof fetch;

    await expect(apiClient.get("/warden/rooms")).rejects.toMatchObject({ status: 403, message: "Warden access only" });
  });

  it("reports an unreachable server as status 0", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed")) as unknown as typeof fetch;
    await expect(apiClient.get("/devices")).rejects.toMatchObject({ status: 0 });
  });

  it("resolves uploaded file paths against the API origin", () => {
    expect(fileUrl("/uploads/a.jpg")).toBe("http://localhost:8000/uploads/a.jpg");
    expect(fileUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(fileUrl(null)).toBeUndefined();
  });
});
