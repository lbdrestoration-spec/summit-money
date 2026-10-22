import { iso, startOfWeek, today, addDays, inRange } from "./calc";
import type { State } from "./types";

/** Chips only come from doing the money habits. They can't be bought or cashed out. */
export const WEEKLY_CAP = 2500;
export const DAILY_LOG = 25;
export const PER_DOLLAR = 10;

export const isLogged = (s: State, dateIso: string) =>
  s.checkins.includes(dateIso) || s.spends.some((x) => x.date === dateIso);

export function earnedThisWeek(s: State, now = today()) {
  const from = startOfWeek(now);
  const to = addDays(from, 6);
  return s.chipLog.filter((e) => inRange(e.date, from, to)).reduce((a, e) => a + e.amount, 0);
}

/** Add earned chips, respecting the weekly cap. Returns the same state if nothing could be added. */
export function grant(s: State, amount: number, reason: string, now = today()): State {
  const room = Math.max(0, WEEKLY_CAP - earnedThisWeek(s, now));
  const g = Math.min(room, Math.floor(amount));
  if (g <= 0) return s;
  return {
    ...s,
    chips: s.chips + g,
    chipLog: [{ id: crypto.randomUUID(), date: iso(now), amount: g, reason }, ...s.chipLog].slice(0, 300),
  };
}
