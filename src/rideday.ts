export type DayPlan = { ticket: number; gas: number; food: number; other: number; days: number };
export const KEY = "summit-money:rideday";
export const EMPTY: DayPlan = { ticket: 0, gas: 0, food: 0, other: 0, days: 5 };

const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0);

export function cleanPlan(o: Record<string, unknown>): DayPlan {
  return { ticket: num(o.ticket, 2000), gas: num(o.gas, 2000), food: num(o.food, 2000), other: num(o.other, 2000), days: Math.round(num(o.days, 120)) };
}
export const perDay = (p: DayPlan) => p.ticket + p.gas + p.food + p.other;
export const seasonCost = (p: DayPlan) => perDay(p) * p.days;

/** Weeks of recent saving the whole plan costs; null when there is no saving rate yet. */
export function weeksFor(p: DayPlan, weekly: number): number | null {
  const cost = seasonCost(p);
  if (!(cost > 0)) return 0;
  return weekly > 0 ? cost / weekly : null;
}

export function readPlan(): DayPlan {
  try {
    return cleanPlan(JSON.parse(localStorage.getItem(KEY) ?? "{}"));
  } catch {
    return { ...EMPTY };
  }
}
export function savePlan(p: DayPlan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
