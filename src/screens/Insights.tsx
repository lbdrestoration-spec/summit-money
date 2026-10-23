import { useState } from "react";
import { addDays, billsBetween, fridaysBetween, money, parse, paychecksBetween, today } from "../calc";
import { projectTo, totalSaved } from "../plan";
import type { State } from "../types";
import { iso } from "../calc";
import type { Actions } from "../store";
import { Button, Card, Heading, label } from "../ui";

/** Every dollar coming in or going out over the next two weeks. Read-only. */
export function Timeline({ state }: { state: State }) {
  const { settings, plan } = state;
  if (!settings || !plan) return null;
  const now = today();
  const end = addDays(now, 14);
  const rows = [
    ...paychecksBetween(settings, now, end).map((p) => ({ date: p.date, name: "Wednesday pay", amount: p.amount })),
    ...fridaysBetween(plan, now, end).map((f) => ({ date: f.date, name: f.overridden ? "Friday pay (adjusted)" : "Friday pay", amount: f.amount })),
    ...billsBetween(state.bills, now, end).map((b) => ({ date: b.date, name: b.name, amount: -b.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const net = rows.reduce((a, r) => a + r.amount, 0);
  return (
    <Card tone="aqua" className="space-y-3">
      <div className="flex items-end justify-between">
        <Heading>Next 14 days</Heading>
        <span className={`font-cc text-xl ${net >= 0 ? "text-cc-lime" : "text-cc-pink"}`}>{net >= 0 ? "+" : "-"}{money(Math.abs(net))}</span>
      </div>
      {rows.length === 0 && <p className="text-sm text-cc-muted">Nothing scheduled.</p>}
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={`${r.date}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm">{r.name}</div>
              <div className={label}>{parse(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
            </div>
            <span className={`font-cc text-xl ${r.amount >= 0 ? "text-cc-lime" : "text-cc-pink"}`}>
              {r.amount >= 0 ? "+" : "-"}
              {money(Math.abs(r.amount))}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Try a different weekly spending amount and see what each deadline would look like. Nothing is saved. */
export function WhatIf({ state }: { state: State }) {
  const plan = state.plan;
  const [spend, setSpend] = useState<number | null>(null);
  if (!plan || !plan.deadlines.length) return null;
  const v = spend ?? plan.weeklySpending;
  const max = Math.max(1000, plan.weeklySpending * 2);
  const test: State = { ...state, plan: { ...plan, weeklySpending: v } };
  const changed = v !== plan.weeklySpending;
  return (
    <Card tone="violet" className="space-y-3">
      <div>
        <Heading tone="violet">What if</Heading>
        <p className="text-xs text-cc-muted">Slide to try a different weekly spending. This is only a preview, your plan stays at {money(plan.weeklySpending)}.</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          step={10}
          value={v}
          onChange={(e) => setSpend(Number(e.target.value))}
          className="min-h-11 w-full accent-[var(--color-cc-violet)]"
          aria-label="Weekly spending to try"
        />
        <span className="w-20 text-right font-cc text-2xl text-cc-violet">{money(v)}</span>
      </div>
      <div className="grid gap-2">
        {plan.deadlines.map((d) => {
          const base = projectTo(state, d);
          const alt = projectTo(test, d);
          if (!base || !alt) return null;
          const diff = alt.projected - base.projected;
          return (
            <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2">
              <span className="min-w-0 truncate text-sm">{d.name}</span>
              <span className="text-right">
                <span className="font-cc text-xl text-cc-lime">{money(alt.projected)}</span>
                {changed && (
                  <span className={`ml-2 font-mono text-[10px] ${diff >= 0 ? "text-cc-lime" : "text-cc-pink"}`}>
                    {diff >= 0 ? "+" : "-"}
                    {money(Math.abs(diff))}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {changed && (
        <button className="min-h-11 font-mono text-[10px] uppercase tracking-wider text-cc-aqua" onClick={() => setSpend(null)}>
          Back to my plan
        </button>
      )}
    </Card>
  );
}


/** How long what you've saved would cover your bills and spending if the pay stopped. */
export function Runway({ state }: { state: State }) {
  const plan = state.plan;
  if (!plan) return null;
  const monthly = state.bills.reduce((a, b) => a + b.amount, 0) + (plan.weeklySpending * 52) / 12;
  if (monthly <= 0) return null;
  const saved = totalSaved(state);
  const days = Math.floor((saved / monthly) * 30);
  return (
    <Card tone="gold" className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className={label}>Runway</div>
        <div className="text-xs text-cc-muted">Days your savings would cover bills and spending if pay stopped</div>
      </div>
      <div className="font-cc text-4xl font-bold leading-none text-cc-gold">{days}</div>
    </Card>
  );
}

/** Bills landing in the next few days. */
export function DueSoon({ state }: { state: State }) {
  const now = today();
  const due = billsBetween(state.bills, now, addDays(now, 4));
  if (!due.length) return null;
  return (
    <Card tone="pink" className="space-y-1">
      <Heading tone="pink">Bills due soon</Heading>
      {due.map((b, i) => {
        const days = Math.round((parse(b.date).getTime() - now.getTime()) / 86400000);
        return (
          <div key={`${b.name}-${i}`} className="flex items-center justify-between text-sm">
            <span>
              {b.name} <span className="text-cc-muted">· {days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}</span>
            </span>
            <span className="font-cc text-xl text-cc-pink">{money(b.amount)}</span>
          </div>
        );
      })}
    </Card>
  );
}

const PAYDAYS_PER_YEAR = 26 + 52;
/** On a payday: a suggested move into each savings bucket, based on its monthly plan. Tap to log it. */
export function PaydaySplit({ state, actions }: { state: State; actions: Actions }) {
  const { settings, plan } = state;
  if (!settings || !plan) return null;
  const now = today();
  const t = iso(now);
  const wed = paychecksBetween(settings, now, now);
  const fri = fridaysBetween(plan, now, now);
  const landed = [...wed.map((p) => p.amount), ...fri.map((f) => f.amount)].reduce((a, b) => a + b, 0);
  const picks = state.buckets
    .filter((b) => b.monthlyPlan > 0)
    .map((b) => ({ b, amt: Math.round((b.monthlyPlan * 12) / PAYDAYS_PER_YEAR), done: b.contributions.some((c) => c.date === t) }))
    .filter((x) => x.amt > 0);
  if (landed <= 0 || !picks.length) return null;
  return (
    <Card tone="lime" className="space-y-2">
      <div>
        <Heading tone="lime">Payday</Heading>
        <p className="text-xs text-cc-muted">{money(landed)} landed today. Move this into your buckets first. Each tap logs it and earns chips.</p>
      </div>
      {picks.map(({ b, amt, done }) => (
        <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-1">
          <span className="min-w-0 truncate text-sm">{b.name}</span>
          <span className="flex items-center gap-2">
            <span className="font-cc text-xl text-cc-lime">{money(amt)}</span>
            <Button variant="lime" disabled={done} onClick={() => actions.contribute(b.id, amt, t)}>
              {done ? "Done" : "Move it"}
            </Button>
          </span>
        </div>
      ))}
    </Card>
  );
}
