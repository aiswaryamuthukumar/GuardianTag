import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

/**
 * Wires React Query's online/offline detection to the device's real network
 * state instead of the browser-only `navigator.onLine` it defaults to (which
 * is always `true` in React Native). Without this, queries/mutations would
 * never pause while offline and would just fail loudly instead.
 */
export function setupOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
    });
  });
}
