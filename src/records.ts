import { addDays, iso, parse, startOfWeek } from "./calc";
import type { State } from "./types";

export type Records = {
  bestWeek: { weekStart: string; amount: number } | null;
  biggestDeposit: { date: string; amount: number; goal: string } | null;
  longestStreak: number;
  totalSaved: number;
};

/** All-time bests, from what you have logged. Withdrawals only count against totals. */
export function records(state: State): Records {
  const weeks: Record<string, number> = {};
  let biggest: Records["biggestDeposit"] = null;
  let total = 0;
  for (const b of state.buckets)
    for (const c of b.contributions) {
      total += c.amount;
      if (c.amount <= 0) continue;
      const k = iso(startOfWeek(parse(c.date)));
      weeks[k] = (weeks[k] ?? 0) + c.amount;
      if (!biggest || c.amount > biggest.amount) biggest = { date: c.date, amount: c.amount, goal: b.name };
    }
  const best = Object.entries(weeks).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0];
  const logged = [...new Set([...state.checkins, ...state.spends.map((s) => s.date)])].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of logged) {
    run = prev && iso(addDays(parse(prev), 1)) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { bestWeek: best ? { weekStart: best[0], amount: best[1] } : null, biggestDeposit: biggest, longestStreak: longest, totalSaved: total };
}
