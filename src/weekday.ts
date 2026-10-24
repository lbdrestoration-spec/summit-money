import { addDays, iso, parse, today } from "./calc";
import type { State } from "./types";

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type DayStat = { day: number; name: string; total: number; avg: number };

/** Average spend per calendar weekday over the last `weeks` full weeks ending today. */
export function weekdayStats(state: State, weeks = 12, now = today()): DayStat[] {
  const since = iso(addDays(now, -(weeks * 7 - 1)));
  const until = iso(now);
  const totals = new Array(7).fill(0);
  for (const s of state.spends) if (s.date >= since && s.date <= until) totals[parse(s.date).getDay()] += s.amount;
  return totals.map((total, day) => ({ day, name: DAYS[day], total, avg: total / weeks }));
}

/** The priciest weekday, or null when there is not enough spending to say. */
export function priciest(stats: DayStat[]): DayStat | null {
  const sum = stats.reduce((a, s) => a + s.total, 0);
  if (sum < 20) return null;
  const top = [...stats].sort((a, b) => b.total - a.total)[0];
  return top.total > 0 ? top : null;
}
