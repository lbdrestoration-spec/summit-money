/** Tiny buzz on Android. Silently does nothing where unsupported. */
export const buzz = (ms: number | number[] = 12) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
};
