import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Storage as sqliteKvStore } from "expo-sqlite/kv-store";

// expo-sqlite/kv-store is a real SQLite-backed AsyncStorage-compatible store
// (not in-memory, not device localStorage) - this is what makes the cached
// devices/assets/incidents survive an app restart with no network at all.
export const queryPersister = createAsyncStoragePersister({
  storage: sqliteKvStore,
  key: "hostdost-query-cache",
});

// How long a persisted cache entry is trusted before React Query throws it
// away on restore rather than showing possibly-very-stale security data.
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
