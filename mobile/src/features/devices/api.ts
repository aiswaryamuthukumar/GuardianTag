import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { Device, DeviceHealth } from "@/src/types/api";

export function useDevices() {
  const api = useApi();
  return useQuery({ queryKey: qk.devices, queryFn: () => api.get<Device[]>("/devices") });
}

export function useDevice(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.device(id),
    queryFn: () => api.get<Device>(`/devices/${id}`),
    // Show the list's copy instantly; realtime keeps both in sync.
    initialData: () => qc.getQueryData<Device[]>(qk.devices)?.find((d) => d.id === id),
  });
}

export function useDeviceHealth(id: string, limit = 60) {
  const api = useApi();
  return useQuery({
    queryKey: qk.deviceHealth(id),
    queryFn: () => api.get<DeviceHealth[]>(`/device-health/${id}?limit=${limit}`),
  });
}

export function usePairDevice() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { device_uid: string; name: string; pairing_code: string }) =>
      api.post<Device>("/devices/pair", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.devices }),
  });
}

export function useRenameDevice(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.patch<Device>(`/devices/${id}`, { name }),
    onSuccess: (device) => {
      qc.setQueryData(qk.device(id), device);
      qc.invalidateQueries({ queryKey: qk.devices });
    },
  });
}

export function useUnpairDevice(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>(`/devices/${id}`),
    onSuccess: () => {
      qc.removeQueries({ queryKey: qk.device(id) });
      qc.invalidateQueries({ queryKey: qk.devices });
      qc.invalidateQueries({ queryKey: qk.assets });
    },
  });
}
