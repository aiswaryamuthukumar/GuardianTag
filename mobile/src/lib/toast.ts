import type { Feather } from "@expo/vector-icons";

export type ToastTone = "primary" | "safe" | "emergency" | "warning";
export interface ToastData {
  id: number;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  tone: ToastTone;
}

type Listener = (toast: ToastData) => void;
let seq = 0;
const listeners = new Set<Listener>();

export const toastBus = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  show(toast: Omit<ToastData, "id">) {
    const full = { ...toast, id: ++seq };
    listeners.forEach((l) => l(full));
  },
};
