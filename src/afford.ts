import { addDays, bucketSaved, iso, today } from "./calc";
import type { State } from "./types";

/** Average dollars moved into savings per week over the last 8 weeks (withdrawals count against it). */
export function weeklySaving(state: State, now = today()): number {
  const since = iso(addDays(now, -56));
  const sum = state.buckets.flatMap((b) => b.contributions).filter((c) => c.date >= since).reduce((a, c) => a + c.amount, 0);
  return Math.max(0, sum / 8);
}

export type Afford = {
  weeks: number | null;
  /** The goal that would finish later, and by how many days */
  goal: { name: string; delayDays: number } | null;
};

/** What a purchase costs in saving time. Pure estimate from recent habits. */
export function afford(state: State, price: number, now = today()): Afford {
  const rate = weeklySaving(state, now);
  if (!(price > 0)) return { weeks: null, goal: null };
  const weeks = rate > 0 ? price / rate : null;
  const open = state.buckets.filter((b) => b.target && bucketSaved(b) < (b.target as number));
  const first = open.sort((a, b) => (a.targetDate ?? "9999") < (b.targetDate ?? "9999") ? -1 : 1)[0];
  const goal = first && rate > 0 ? { name: first.name, delayDays: Math.ceil((price / rate) * 7) } : null;
  return { weeks, goal };
}
