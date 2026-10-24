import { addDays, billsBetween, bucketSaved, daysBetween, iso, money, parse, today } from "./calc";
import { isLogged } from "./chips";
import { projectTo } from "./plan";
import type { State } from "./types";

export type Move = { id: string; text: string; tab: "spend" | "goals" | "plan" | "week" | null };

/** The single most useful thing to do right now, from plain rules. Highest priority first. */
export function nextMove(state: State, now = today()): Move {
  const t = iso(now);
  // 1. a bill due in the next two days that isn't marked paid
  const due = billsBetween(state.bills, now, addDays(now, 2)).find((b) => !state.billsPaid.includes(`${b.name}:${b.date}`));
  if (due) {
    const d = daysBetween(now, parse(due.date));
    return { id: "bill", text: `${due.name} (${money(due.amount)}) is due ${d <= 0 ? "today" : d === 1 ? "tomorrow" : "in 2 days"}.`, tab: "plan" };
  }
  // 2. behind pace on a deadline with a goal
  const open = state.buckets.filter((b) => b.target && bucketSaved(b) < (b.target as number));
  for (const d of state.plan?.deadlines ?? []) {
    const p = projectTo(state, d, now);
    if (p && p.goalGap !== null && p.goalGap < 0 && open.length > 0) {
      const perWeek = Math.ceil(-p.goalGap / Math.max(1, p.days / 7));
      return { id: "pace", text: `${d.name} is ${money(-p.goalGap)} short at this pace. About ${money(perWeek)} a week closes it.`, tab: "goals" };
    }
  }
  // 3. nothing logged today
  if (!isLogged(state, t)) return { id: "log", text: "Log today (even a no-spend day) to keep your streak.", tab: "spend" };
  // 4. nothing saved this week yet
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  const savedWeek = state.buckets.flatMap((b) => b.contributions).filter((c) => c.date >= iso(monday) && c.amount > 0).length;
  if (state.buckets.length > 0 && savedWeek === 0) return { id: "save", text: "Nothing saved yet this week. Even $10 into a bucket keeps your weekly streak alive.", tab: "goals" };
  return { id: "ok", text: "You're on track today. Nice work.", tab: null };
}
