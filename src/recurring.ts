import type { Bill, Spend } from "./types";

export type Recurring = { name: string; amount: number; dueDay: number; count: number };

const dayNum = (d: string) => Math.floor(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000);

/** Spends that look like a monthly charge: same note, similar amount, three or more times about a month apart. Skips anything already a bill. */
export function findRecurring(spends: Spend[], bills: Bill[]): Recurring[] {
  const groups = new Map<string, Spend[]>();
  for (const s of spends) {
    const k = s.note.trim().toLowerCase();
    if (!k || s.amount <= 0) continue;
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  const have = bills.map((b) => b.name.trim().toLowerCase());
  const out: Recurring[] = [];
  for (const [key, list] of groups) {
    if (list.length < 3) continue;
    if (have.some((h) => h && (h.includes(key) || key.includes(h)))) continue;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
    const amounts = sorted.map((s) => s.amount);
    const mid = [...amounts].sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
    if (amounts.some((a) => Math.abs(a - mid) > mid * 0.1)) continue;
    const gaps = sorted.slice(1).map((s, i) => dayNum(s.date) - dayNum(sorted[i].date));
    if (!gaps.every((g) => g >= 25 && g <= 35)) continue;
    const last = sorted[sorted.length - 1];
    out.push({ name: last.note.trim(), amount: Math.round(mid * 100) / 100, dueDay: Math.min(31, Math.max(1, +last.date.slice(8, 10))), count: sorted.length });
  }
  return out.sort((a, b) => b.amount - a.amount);
}
