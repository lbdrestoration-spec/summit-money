import { billsBetween, daysBetween, fridaysBetween, parse, paychecksBetween, today } from "./calc";
import type { Deadline, State } from "./types";

export const totalSaved = (s: State) => s.buckets.reduce((a, b) => a + b.contributions.reduce((x, c) => x + c.amount, 0), 0);

/** What you should have saved by a deadline, given the pay you expect and what you let yourself spend. */
export function projectTo(state: State, d: Deadline, now = today()) {
  const plan = state.plan;
  if (!plan || !state.settings) return null;
  const end = parse(d.date);
  if (end < now) return null;
  const wednesday = paychecksBetween(state.settings, now, end).reduce((a, c) => a + c.amount, 0);
  const fridays = fridaysBetween(plan, now, end);
  const friday = fridays.reduce((a, f) => a + f.amount, 0);
  const fridayFull = fridays.length * plan.fridayAmount;
  const bills = billsBetween(state.bills, now, end).reduce((a, b) => a + b.amount, 0);
  const days = daysBetween(now, end);
  const spending = plan.weeklySpending * (days / 7);
  const saved = totalSaved(state);
  const projected = saved + wednesday + friday - bills - spending;
  return {
    days,
    saved,
    wednesday,
    friday,
    /** How much less Friday pay is coming than the usual amount, because of weeks you marked short */
    fridayShort: Math.max(0, fridayFull - friday),
    bills,
    spending,
    projected,
    goalGap: d.goal ? projected - d.goal : null,
  };
}
