import type { State } from "./types";

export type UsualSpend = { amount: number; category: string; count: number };
export type UsualSave = { amount: number; bucketId: string; bucketName: string; count: number };

/** Spends you repeat: the same category and amount at least twice in the last 90 days, most frequent first. */
export function usualSpends(state: State, now: string, max = 3): UsualSpend[] {
  const from = new Date(`${now}T12:00:00`);
  from.setDate(from.getDate() - 90);
  const since = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
  const map = new Map<string, UsualSpend>();
  for (const s of state.spends) {
    if (s.date < since || s.amount <= 0) continue;
    const key = `${s.category}|${s.amount}`;
    const e = map.get(key) ?? { amount: s.amount, category: s.category, count: 0 };
    e.count++;
    map.set(key, e);
  }
  return [...map.values()].filter((e) => e.count >= 2).sort((a, b) => b.count - a.count || b.amount - a.amount).slice(0, max);
}

/** Deposits you repeat: the same bucket and amount at least twice in the last 90 days. */
export function usualSaves(state: State, now: string, max = 3): UsualSave[] {
  const from = new Date(`${now}T12:00:00`);
  from.setDate(from.getDate() - 90);
  const since = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
  const out: UsualSave[] = [];
  for (const b of state.buckets) {
    const counts = new Map<number, number>();
    for (const c of b.contributions) if (c.date >= since && c.amount > 0) counts.set(c.amount, (counts.get(c.amount) ?? 0) + 1);
    for (const [amount, count] of counts) if (count >= 2) out.push({ amount, bucketId: b.id, bucketName: b.name, count });
  }
  return out.sort((a, b) => b.count - a.count || b.amount - a.amount).slice(0, max);
}
