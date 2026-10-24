import { addDays, daysBetween, iso, parse, today } from "./calc";
import { projectTo } from "./plan";
import type { State } from "./types";

/** Items on the Montana trip checklist that are about the ride itself (not scouting). */
export const TRIP_ITEMS = ["t-tickets", "t-lodging", "t-tune", "t-gear", "t-tires", "t-gas"];

export type Part = { name: string; value: number };

/** The ski trip deadline: the first one that sounds like it, else Dec 10 with no goal. */
export function tripDeadline(state: State) {
  const dl = state.plan?.deadlines.find((d) => /ski|snow|board|montana|trip/i.test(d.name));
  return dl ?? { id: "", name: "Montana ski trip", date: "2026-12-10", goal: undefined as number | undefined };
}

/** A rough readiness gauge for the trip: money, checklist and board prep, each 0 to 1, averaged over what applies. */
export function readiness(state: State, now = today()) {
  const trip = tripDeadline(state);
  const days = daysBetween(now, parse(trip.date));
  const parts: Part[] = [];
  const p = state.plan && "id" in trip && trip.id ? projectTo(state, trip as never, now) : null;
  if (p && trip.goal) parts.push({ name: "Money", value: Math.max(0, Math.min(1, p.projected / trip.goal)) });
  parts.push({ name: "Checklist", value: TRIP_ITEMS.filter((i) => state.packed.includes(i)).length / TRIP_ITEMS.length });
  const from = iso(addDays(now, -13));
  parts.push({ name: "Board prep", value: Math.min(1, new Set(state.prepDays.filter((d) => d >= from)).size / 10) });
  const pct = Math.round((parts.reduce((a, x) => a + x.value, 0) / parts.length) * 100);
  return { trip, days, parts, pct };
}
