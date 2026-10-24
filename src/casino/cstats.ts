const KEY = "summit-money:casinostats";
export type CStats = { biggest: number; payouts: number; bigWins: number; bestVisit: number };
export const EMPTY: CStats = { biggest: 0, payouts: 0, bigWins: 0, bestVisit: 0 };

export function readStats(): CStats {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
    return { biggest: n(o.biggest), payouts: n(o.payouts), bigWins: n(o.bigWins), bestVisit: n(o.bestVisit) };
  } catch {
    return { ...EMPTY };
  }
}

/** Fold one chip change into the stats. Positive changes are payouts; 500+ counts as a big win. */
export function noteChange(s: CStats, delta: number): CStats {
  if (delta <= 0) return s;
  return { ...s, biggest: Math.max(s.biggest, delta), payouts: s.payouts + 1, bigWins: s.bigWins + (delta >= 500 ? 1 : 0) };
}
export const noteVisit = (s: CStats, net: number): CStats => (net > s.bestVisit ? { ...s, bestVisit: net } : s);

export function saveStats(s: CStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
