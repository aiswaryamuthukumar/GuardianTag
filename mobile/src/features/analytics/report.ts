import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatDuration, hourLabel, WEEKDAYS } from "@/src/lib/format";
import type { AnalyticsSummary, AssetCoverage, DailyIncidentCount, Heatmap, ResponseTimes, User } from "@/src/types/api";

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/** Renders the analytics as a one-page PDF and opens the share sheet. */
export async function exportSecurityReport(data: {
  me?: User;
  summary?: AnalyticsSummary;
  trend?: DailyIncidentCount[];
  response?: ResponseTimes;
  coverage?: AssetCoverage;
  heatmap?: Heatmap;
}) {
  const { me, summary, trend = [], response, coverage, heatmap } = data;
  const max = Math.max(1, ...trend.map((d) => d.count));
  const bars = trend
    .map(
      (d) =>
        `<div class="bar"><div style="height:${(d.count / max) * 100}%"></div><span>${d.date.slice(5)}</span></div>`,
    )
    .join("");
  const peak =
    heatmap?.peak_weekday != null && heatmap.peak_hour != null
      ? `${WEEKDAYS[heatmap.peak_weekday]} around ${hourLabel(heatmap.peak_hour)}`
      : "Not enough data yet";

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Roboto,sans-serif;color:#15151F;padding:28px}
    h1{margin:0;color:#6D28D9} .muted{color:#666}
    .grid{display:flex;gap:12px;margin:18px 0}
    .tile{flex:1;border:1px solid #ddd;border-radius:10px;padding:12px}
    .tile b{font-size:22px;display:block}
    .chart{display:flex;align-items:flex-end;height:140px;gap:4px;border-bottom:1px solid #ccc;margin-top:8px}
    .bar{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}
    .bar div{width:100%;background:#8B5CF6;border-radius:3px 3px 0 0;min-height:1px}
    .bar span{font-size:8px;color:#666;margin-top:3px}
    table{width:100%;border-collapse:collapse;margin-top:8px} td{padding:6px;border-bottom:1px solid #eee}
  </style></head><body>
    <h1>GuardianTag Security Report</h1>
    <div class="muted">${escape(me?.full_name ?? "")}${me?.hostel_block ? ` · Block ${escape(me.hostel_block)}` : ""}${me?.room_number ? ` · Room ${escape(me.room_number)}` : ""} · generated ${new Date().toLocaleString()}</div>
    <div class="grid">
      <div class="tile"><b>${summary?.open_incidents ?? 0}</b>Open incidents</div>
      <div class="tile"><b>${summary?.resolved_incidents ?? 0}</b>Resolved</div>
      <div class="tile"><b>${summary?.false_alarms ?? 0}</b>False alarms</div>
      <div class="tile"><b>${coverage?.coverage_percent ?? 0}%</b>Belongings armed</div>
    </div>
    <h3>Incidents, last ${trend.length} days</h3>
    <div class="chart">${bars}</div>
    <h3>Response</h3>
    <table>
      <tr><td>Average time to resolve</td><td>${formatDuration(response?.avg_resolution_seconds ?? null)}</td></tr>
      <tr><td>Average on-device disarm</td><td>${formatDuration(response?.avg_disarm_seconds ?? null)}</td></tr>
      <tr><td>Fastest disarm</td><td>${formatDuration(response?.fastest_disarm_seconds ?? null)}</td></tr>
      <tr><td>Busiest time for alerts (30 days)</td><td>${peak}</td></tr>
      <tr><td>Devices / belongings</td><td>${summary?.total_devices ?? 0} / ${summary?.total_assets ?? 0}</td></tr>
    </table>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share security report", UTI: "com.adobe.pdf" });
  }
  return uri;
}
