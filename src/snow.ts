import type { Spend } from "./types";

/** First day (ISO) of the snow season that contains `d`: Oct 1, this year or last. */
export function seasonStart(d: Date): string {
  const y = d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-10-01`;
}

/** Spends that look like lift tickets, passes or gear for the season. */
export const isSnowSpend = (s: Pick<Spend, "category" | "note">) => /lift|ski|snow|board|pass/i.test(`${s.category} ${s.note}`);

/** Days on snow this season and what each one has cost so far. */
export function seasonStats(rides: string[], spends: Spend[], now: Date) {
  const from = seasonStart(now);
  const days = new Set(rides.filter((r) => r >= from)).size;
  const cost = spends.filter((s) => s.date >= from && isSnowSpend(s)).reduce((a, s) => a + s.amount, 0);
  return { days, cost, perDay: days > 0 && cost > 0 ? cost / days : null };
}
