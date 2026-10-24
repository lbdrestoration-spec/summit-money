import type { State } from "./types";

export type YearStats = {
  saved: number;
  bestMonth: { month: number; amount: number } | null;
  topCategory: { name: string; amount: number } | null;
  daysLogged: number;
  spent: number;
};

/** The year so far: net saved, best saving month, biggest spending category, days you checked in. */
export function yearStats(state: State, year: number, through: string): YearStats {
  const key = String(year);
  const inYear = (d: string) => d.startsWith(key) && d <= through;
  const byMonth = new Array(12).fill(0) as number[];
  let saved = 0;
  for (const b of state.buckets)
    for (const c of b.contributions)
      if (inYear(c.date)) {
        saved += c.amount;
        byMonth[Number(c.date.slice(5, 7)) - 1] += c.amount;
      }
  let best: YearStats["bestMonth"] = null;
  byMonth.forEach((amount, i) => {
    if (amount > 0 && (!best || amount > best.amount)) best = { month: i, amount };
  });
  const spends = state.spends.filter((s) => inYear(s.date));
  const byCat: Record<string, number> = {};
  for (const s of spends) byCat[s.category] = (byCat[s.category] ?? 0) + s.amount;
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const days = new Set([...state.checkins.filter(inYear), ...spends.map((s) => s.date)]);
  return {
    saved,
    bestMonth: best,
    topCategory: top ? { name: top[0], amount: top[1] } : null,
    daysLogged: days.size,
    spent: spends.reduce((a, s) => a + s.amount, 0),
  };
}
