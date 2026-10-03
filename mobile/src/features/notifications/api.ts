import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/lib/api/keys";
import { useApi } from "@/src/lib/api/useApi";
import type { Notice, Notification } from "@/src/types/api";

export function useNotifications() {
  const api = useApi();
  return useQuery({ queryKey: qk.notifications, queryFn: () => api.get<Notification[]>("/notifications?limit=100") });
}

export function useUnreadCount() {
  const api = useApi();
  return useQuery({
    queryKey: qk.unread,
    queryFn: async () => (await api.get<{ unread: number }>("/notifications/unread-count")).unread,
  });
}

export function useMarkRead() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Notification>(`/notifications/${id}/read`),
    onMutate: (id) => {
      const wasUnread = qc.getQueryData<Notification[]>(qk.notifications)?.find((n) => n.id === id && !n.is_read);
      qc.setQueryData<Notification[]>(qk.notifications, (list) =>
        list?.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      if (wasUnread) qc.setQueryData<number>(qk.unread, (c) => Math.max(0, (c ?? 1) - 1));
    },
  });
}

export function useMarkAllRead() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onMutate: () => {
      qc.setQueryData<Notification[]>(qk.notifications, (list) => list?.map((n) => ({ ...n, is_read: true })));
      qc.setQueryData(qk.unread, 0);
    },
  });
}

export function useNotices() {
  const api = useApi();
  return useQuery({ queryKey: qk.notices, queryFn: () => api.get<Notice[]>("/notices") });
}
