import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { Evidence, EvidenceType, Incident, IncidentDetail, IncidentSeverity, IncidentStatus } from "@/src/types/api";

export type IncidentFilter = { status?: IncidentStatus; severity?: IncidentSeverity; active?: boolean };

export function useIncidents(filter: IncidentFilter = {}) {
  const api = useApi();
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.severity) params.set("severity", filter.severity);
  if (filter.active) params.set("active", "true");
  const query = params.toString();
  return useQuery({
    queryKey: qk.incidents(filter),
    queryFn: () => api.get<Incident[]>(`/incidents${query ? `?${query}` : ""}`),
  });
}

export function useIncident(id: string) {
  const api = useApi();
  return useQuery({ queryKey: qk.incident(id), queryFn: () => api.get<IncidentDetail>(`/incidents/${id}`) });
}

/** After any incident change: refresh the detail, every list, and the numbers derived from them. */
export function refreshIncidentViews(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: qk.incident(id) });
  qc.invalidateQueries({ queryKey: ["incidents"] });
  qc.invalidateQueries({ queryKey: ["analytics"] });
  qc.invalidateQueries({ queryKey: ["warden"] });
}

function useIncidentMutation<TVars, TResult>(id: string, fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      refreshIncidentViews(qc, id);
      qc.invalidateQueries({ queryKey: ["gamification"] });
    },
  });
}

export function useAcknowledge(id: string) {
  const api = useApi();
  return useIncidentMutation(id, () => api.post<Incident>(`/incidents/${id}/acknowledge`));
}

export function useResolve(id: string) {
  const api = useApi();
  return useIncidentMutation(id, (body: { status: "resolved" | "false_alarm"; resolution_notes?: string }) =>
    api.patch<Incident>(`/incidents/${id}/resolve`, body),
  );
}

export function useAddNote(id: string) {
  const api = useApi();
  return useIncidentMutation(id, (note: string) => api.post<IncidentDetail>(`/incidents/${id}/notes`, { note }));
}

export function useAddEvidence(id: string) {
  const api = useApi();
  return useIncidentMutation(id, (body: { type: EvidenceType; content?: string; url?: string }) =>
    api.post<Evidence>(`/incidents/${id}/evidence`, body),
  );
}
