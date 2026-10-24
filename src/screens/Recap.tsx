import { useState } from "react";
import { iso, money, parse, today } from "../calc";
import type { State } from "../types";
import { Card, Heading, label } from "../ui";

export type RecapData = {
  saved: number;
  spent: number;
  topCategory: { name: string; amount: number } | null;
  noSpendDays: number;
  daysCounted: number;
  bestDay: { date: string; amount: number } | null;
};

/** One calendar month at a glance. `monthKey` is yyyy-mm; `through` limits the days counted (ISO). */
export function recap(state: State, monthKey: string, through: string): RecapData {
  const inMonth = (d: string) => d.startsWith(monthKey) && d <= through;
  const deposits: Record<string, number> = {};
  let saved = 0;
  for (const b of state.buckets)
    for (const c of b.contributions)
      if (inMonth(c.date)) {
        saved += c.amount;
        if (c.amount > 0) deposits[c.date] = (deposits[c.date] ?? 0) + c.amount;
      }
  const spends = state.spends.filter((s) => inMonth(s.date));
  const spent = spends.reduce((a, s) => a + s.amount, 0);
  const byCat: Record<string, number> = {};
  for (const s of spends) byCat[s.category] = (byCat[s.category] ?? 0) + s.amount;
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const [y, m] = monthKey.split("-").map(Number);
  const last = Math.min(new Date(y, m, 0).getDate(), Number(through.slice(0, 7) === monthKey ? through.slice(8) : 31));
  const spendDays = new Set(spends.map((s) => s.date));
  let noSpendDays = 0;
  for (let d = 1; d <= last; d++) {
    const key = `${monthKey}-${String(d).padStart(2, "0")}`;
    if (!spendDays.has(key)) noSpendDays++;
  }
  const best = Object.entries(deposits).sort((a, b) => b[1] - a[1])[0];
  return {
    saved,
    spent,
    topCategory: top ? { name: top[0], amount: top[1] } : null,
    noSpendDays,
    daysCounted: last,
    bestDay: best ? { date: best[0], amount: best[1] } : null,
  };
}

const keyOf = (d: Date) => iso(d).slice(0, 7);

export function Recap({ state }: { state: State }) {
  const now = today();
  const [prev, setPrev] = useState(false);
  const cur = keyOf(now);
  const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = prev ? keyOf(pm) : cur;
  const r = recap(state, monthKey, prev ? `${monthKey}-31` : iso(now));
  const title = new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5)) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <Card tone="lime" className="space-y-3">
      <Heading tone="lime">Month recap</Heading>
      <div className="flex gap-2" role="group" aria-label="Recap month">
        {[false, true].map((p) => (
          <button
            key={String(p)}
            aria-pressed={prev === p}
            onClick={() => setPrev(p)}
            className={`min-h-11 rounded-full border px-3 font-mono text-[10px] uppercase tracking-wider ${prev === p ? "border-cc-lime bg-cc-lime/15 text-cc-lime" : "border-cc-line text-cc-muted"}`}
          >
            {p ? "Last month" : "This month"}
          </button>
        ))}
      </div>
      <div className="font-cc text-lg uppercase">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={label}>Saved</div>
          <div className="font-cc text-2xl text-cc-lime">{money(r.saved)}</div>
        </div>
        <div>
          <div className={label}>Spent</div>
          <div className="font-cc text-2xl text-cc-orange">{money(r.spent)}</div>
        </div>
      </div>
      <ul className="space-y-1 text-sm text-cc-snow/90">
        <li>{r.noSpendDays} of {r.daysCounted} days with no spending</li>
        {r.topCategory && <li>Most went to {r.topCategory.name}: {money(r.topCategory.amount)}</li>}
        {r.bestDay && (
          <li>
            Best saving day: {parse(r.bestDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, {money(r.bestDay.amount)}
          </li>
        )}
        {!r.topCategory && !r.bestDay && <li>Nothing logged this month yet.</li>}
      </ul>
    </Card>
  );
}
