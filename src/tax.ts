import type { Bucket, Income } from "./types";

export type SetAside = {
  income: number;
  target: number;
  moved: number;
  remaining: number;
  bucket: Bucket | null;
};

/** The bucket used for tax money: the first one with "tax" in its name. */
export const taxBucket = (buckets: Bucket[]): Bucket | null => buckets.find((b) => /tax/i.test(b.name)) ?? null;

/** How much of this month's side income to set aside at `rate` percent, less what already went into the tax bucket this month. */
export function setAside(incomes: Income[], buckets: Bucket[], rate: number, monthKey: string): SetAside {
  const income = incomes.filter((i) => i.date.startsWith(monthKey)).reduce((a, i) => a + i.amount, 0);
  const target = Math.round(income * (Math.max(0, Math.min(60, rate)) / 100) * 100) / 100;
  const bucket = taxBucket(buckets);
  const moved = bucket ? bucket.contributions.filter((c) => c.date.startsWith(monthKey) && c.amount > 0).reduce((a, c) => a + c.amount, 0) : 0;
  return { income, target, moved, remaining: Math.max(0, Math.round((target - moved) * 100) / 100), bucket };
}
