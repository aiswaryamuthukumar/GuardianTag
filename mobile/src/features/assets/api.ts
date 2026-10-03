import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { Asset, AssetInput } from "@/src/types/api";

export function useAssets() {
  const api = useApi();
  return useQuery({ queryKey: qk.assets, queryFn: () => api.get<Asset[]>("/assets") });
}

export function useAsset(id: string | undefined) {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.asset(id ?? ""),
    queryFn: () => api.get<Asset>(`/assets/${id}`),
    enabled: !!id,
    initialData: () => qc.getQueryData<Asset[]>(qk.assets)?.find((a) => a.id === id),
  });
}

/** Writes one asset into both the list and the detail cache. */
export function cacheAsset(qc: ReturnType<typeof useQueryClient>, asset: Asset) {
  qc.setQueryData(qk.asset(asset.id), asset);
  qc.setQueryData<Asset[]>(qk.assets, (list) => {
    if (!list) return list;
    const exists = list.some((a) => a.id === asset.id);
    return exists ? list.map((a) => (a.id === asset.id ? asset : a)) : [...list, asset];
  });
}

export function useSaveAsset(id?: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AssetInput) => (id ? api.patch<Asset>(`/assets/${id}`, body) : api.post<Asset>("/assets", body)),
    onSuccess: (asset) => {
      cacheAsset(qc, asset);
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

/** Arm/disarm with an optimistic flip so the switch responds instantly. */
export function useSetArmed() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, armed }: { id: string; armed: boolean }) =>
      api.patch<Asset>(`/assets/${id}`, { is_armed: armed }),
    onMutate: async ({ id, armed }) => {
      await qc.cancelQueries({ queryKey: qk.assets });
      const previous = qc.getQueryData<Asset[]>(qk.assets);
      qc.setQueryData<Asset[]>(qk.assets, (list) => list?.map((a) => (a.id === id ? { ...a, is_armed: armed } : a)));
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(qk.assets, ctx.previous),
    onSuccess: (asset) => cacheAsset(qc, asset),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["gamification"] });
    },
  });
}

export function useArmAll() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (armed: boolean) => api.post<Asset[]>("/assets/arm-all", { armed }),
    onSuccess: (assets) => {
      qc.setQueryData(qk.assets, assets);
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["gamification"] });
    },
  });
}

export function useDeleteAsset(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>(`/assets/${id}`),
    onSuccess: () => {
      qc.removeQueries({ queryKey: qk.asset(id) });
      qc.setQueryData<Asset[]>(qk.assets, (list) => list?.filter((a) => a.id !== id));
      qc.invalidateQueries({ queryKey: qk.schedules });
    },
  });
}
