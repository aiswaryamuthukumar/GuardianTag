import { Storage } from "expo-sqlite/kv-store";

// Stored on the device, so the intro slides show once per install, not once per account.
const KEY = "guardiantag.onboarding_seen";

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await Storage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await Storage.setItem(KEY, "1");
  } catch {
    // Worst case the slides show again next launch.
  }
}
