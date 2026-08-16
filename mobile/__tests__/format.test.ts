import { formatDuration } from "@/lib/format";

describe("formatDuration", () => {
  it("returns an em dash for null", () => {
    expect(formatDuration(null)).toBe("—");
  });

  it("formats sub-minute durations in seconds", () => {
    expect(formatDuration(1.77)).toBe("1.8s");
    expect(formatDuration(59.9)).toBe("59.9s");
  });

  it("formats sub-hour durations in minutes", () => {
    expect(formatDuration(90)).toBe("1.5m");
    expect(formatDuration(3599)).toBe("60.0m");
  });

  it("formats sub-day durations in hours", () => {
    expect(formatDuration(3600)).toBe("1.0h");
    expect(formatDuration(3600 * 23)).toBe("23.0h");
  });

  it("formats multi-day durations in days", () => {
    expect(formatDuration(3600 * 25)).toBe("1.0d");
    expect(formatDuration(3600 * 48)).toBe("2.0d");
  });
});
