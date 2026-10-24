const KEY = "summit-money:haptics";

/** Whether vibration is allowed. On unless switched off. */
export function hapticsOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setHaptics(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

/** Tiny buzz on Android. Silently does nothing where unsupported or switched off. */
export const buzz = (ms: number | number[] = 12) => {
  try {
    if (!hapticsOn()) return;
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
};
