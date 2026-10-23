import { useState } from "react";
import { addDays, billsBetween, daysBetween, endOfMonth, fridaysBetween, money, monthStats, parse, paychecksBetween, startOfMonth, today } from "../calc";
import { projectTo, totalSaved } from "../plan";
import type { State } from "../types";
import { iso } from "../calc";
import type { Actions } from "../store";
import { bucketIcon } from "../bucketIcon";
import { Button, Card, Heading, Progress, label } from "../ui";

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

/** Every day this month: logged, no-spend, heavy spend, or not logged yet. */
export function MonthCalendar({ state }: { state: State }) {
  const now = today();
  const first = startOfMonth(now);
  const last = endOfMonth(now).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const spentBy = new Map<string, number>();
  state.spends.forEach((x) => spentBy.set(x.date, (spentBy.get(x.date) ?? 0) + x.amount));
  const daily = Math.max(1, (state.plan?.weeklySpending ?? 150) / 7);
  const cells = Array.from({ length: lead + last }, (_, i) => (i < lead ? null : i - lead + 1));
  const todayN = now.getDate();
  const cls = (n: number) => {
    const d = iso(new Date(now.getFullYear(), now.getMonth(), n));
    const spent = spentBy.get(d) ?? 0;
    const logged = state.checkins.includes(d) || spentBy.has(d);
    if (n > todayN) return "border-cc-line/40 text-cc-muted/50";
    if (!logged) return "border-cc-line/70 text-cc-muted";
    if (spent === 0) return "border-cc-lime/60 bg-cc-lime/20 text-cc-lime";
    if (spent <= daily) return "border-cc-aqua/60 bg-cc-aqua/20 text-cc-aqua";
    if (spent <= daily * 2) return "border-cc-orange/60 bg-cc-orange/20 text-cc-orange";
    return "border-cc-pink/60 bg-cc-pink/20 text-cc-pink";
  };
  return (
    <Card tone="lime" className="space-y-2">
      <Heading tone="lime">{now.toLocaleDateString("en-US", { month: "long" })} at a glance</Heading>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="font-mono text-[10px] text-cc-muted">
            {d}
          </span>
        ))}
        {cells.map((n, i) =>
          n === null ? (
            <span key={i} />
          ) : (
            <span key={i} className={`flex aspect-square items-center justify-center rounded-md border font-cc text-base ${cls(n)} ${n === todayN ? "ring-1 ring-cc-snow" : ""}`}>
              {n}
            </span>
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-cc-muted">
        <span className="text-cc-lime">■ no spend</span>
        <span className="text-cc-aqua">■ on pace</span>
        <span className="text-cc-orange">■ heavy</span>
        <span className="text-cc-pink">■ big</span>
      </div>
    </Card>
  );
}

/** Days until each deadline, as small pills. */
export function Countdowns({ state }: { state: State }) {
  const now = today();
  const items = (state.plan?.deadlines ?? []).map((d) => ({ d, n: daysBetween(now, parse(d.date)) })).filter((x) => x.n >= 0);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map(({ d, n }) => (
        <span key={d.id} className="rounded-full border border-cc-aqua/40 bg-cc-aqua/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-cc-aqua">
          <span className="font-cc text-lg font-bold">{n}</span> days · {d.name}
        </span>
      ))}
    </div>
  );
}

const SLICES = ["var(--color-cc-lime)", "var(--color-cc-aqua)", "var(--color-cc-gold)", "var(--color-cc-violet)", "var(--color-cc-orange)", "var(--color-cc-pink)"];

/** Where your savings sit, as a donut. */
export function SavingsSplit({ state }: { state: State }) {
  const parts = state.buckets.map((b) => ({ name: b.name, v: b.contributions.reduce((a, c) => a + c.amount, 0) })).filter((x) => x.v > 0);
  const total = parts.reduce((a, b) => a + b.v, 0);
  if (!total) return null;
  const R = 42;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <Card tone="lime" className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label="Savings by bucket">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-cc-line)" strokeWidth="14" />
        {parts.map((p, i) => {
          const len = (p.v / total) * C;
          const el = <circle key={p.name} cx="60" cy="60" r={R} fill="none" stroke={SLICES[i % SLICES.length]} strokeWidth="14" strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-1">
        <Heading tone="lime">Where it sits</Heading>
        {parts.map((p, i) => (
          <div key={p.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SLICES[i % SLICES.length] }} />
              <span className="truncate">{bucketIcon(p.name)} {p.name}</span>
            </span>
            <span className="font-cc text-lg">{money(p.v)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const MILESTONES = [250, 500, 1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 50000];

/** Next savings milestone, with an ETA from the last 8 weeks of deposits. */
export function Milestones({ state }: { state: State }) {
  const total = totalSaved(state);
  const next = MILESTONES.find((m) => m > total);
  const prev = [...MILESTONES].reverse().find((m) => m <= total) ?? 0;
  const now = today();
  const from = iso(addDays(now, -56));
  const recent = state.buckets.flatMap((b) => b.contributions).filter((c) => c.date >= from && c.date <= iso(now)).reduce((a, c) => a + c.amount, 0);
  const perDay = recent / 56;
  if (!next) return null;
  const eta = perDay > 0 ? Math.ceil((next - total) / perDay) : null;
  const when = eta !== null ? addDays(now, eta).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  return (
    <Card tone="gold" className="space-y-2">
      <Heading tone="gold">Next milestone</Heading>
      <div className="flex items-end justify-between">
        <div className="font-cc text-4xl font-bold text-cc-gold">{money(next)}</div>
        <div className={label}>{money(next - total)} to go</div>
      </div>
      <Progress value={(total - prev) / (next - prev)} tone="gold" />
      <div className="text-xs text-cc-muted">
        {when ? `At your pace of the last 8 weeks, around ${when} (${eta} days).` : "Add a deposit and I'll estimate the day you hit it."}
      </div>
    </Card>
  );
}

/** This month's deposits against the monthly plan, and the share of income saved. */
export function SavingsRate({ state }: { state: State }) {
  const now = today();
  const from = iso(startOfMonth(now));
  const to = iso(endOfMonth(now));
  const deposited = state.buckets.flatMap((b) => b.contributions).filter((c) => c.date >= from && c.date <= to).reduce((a, c) => a + c.amount, 0);
  const planned = state.buckets.reduce((a, b) => a + b.monthlyPlan, 0);
  const m = monthStats(state, now);
  const income = m.paychecks + m.weekly + m.sideIncome;
  if (planned <= 0 && deposited <= 0) return null;
  const pct = income > 0 ? Math.round((deposited / income) * 100) : 0;
  return (
    <Card tone="lime" className="space-y-2">
      <Heading tone="lime">Saved this month</Heading>
      <div className="flex items-end justify-between">
        <div className="font-cc text-4xl font-bold text-cc-lime">{money(deposited)}</div>
        <div className={label}>{planned > 0 ? `of ${money(planned)} planned` : "no plan set"}</div>
      </div>
      {planned > 0 && <Progress value={Math.min(1, deposited / planned)} tone="lime" />}
      <div className="text-xs text-cc-muted">
        {income > 0 ? `That's ${pct}% of this month's income.` : ""}
        {planned > 0 && deposited >= planned ? " Plan met. Anything more is a bonus." : planned > deposited ? ` ${money(planned - deposited)} left to hit the plan.` : ""}
      </div>
    </Card>
  );
}

/** 52-week challenge: tap week n to put n x step into a bucket. Tap again to undo. */
export function Challenge({ state, actions }: { state: State; actions: Actions }) {
  const [open, setOpen] = useState(false);
  const [bucketId, setBucketId] = useState("");
  const step = state.challengeStep;
  const done = new Set(state.challenge.map((c) => c.week));
  const total = Array.from(done).reduce((a, w) => a + w * step, 0);
  const goal = (52 * 53 * step) / 2;
  const target = bucketId || state.buckets[0]?.id || "";
  if (state.buckets.length === 0) return null;
  return (
    <Card tone="aqua" className="space-y-2">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Heading tone="aqua">52-week challenge</Heading>
        <span className="font-cc text-xl text-cc-aqua">{open ? "−" : "+"}</span>
      </button>
      <div className="text-xs text-cc-muted">
        {done.size} of 52 weeks · {money(total)} of {money(goal)}
      </div>
      <Progress value={total / goal} tone="aqua" />
      {open && (
        <div className="space-y-3 pt-1">
          <p className="text-xs text-cc-muted">Week 1 saves {money(step)}, week 2 saves {money(2 * step)}, and so on. Tap a week to deposit it. Tap again to undo.</p>
          <div className="flex gap-2">
            {[1, 2, 5].map((n) => (
              <button
                key={n}
                disabled={state.challenge.length > 0}
                onClick={() => actions.setChallengeStep(n)}
                className={`min-h-11 flex-1 rounded-lg border px-2 font-mono text-xs uppercase tracking-wider ${step === n ? "border-cc-aqua text-cc-aqua" : "border-cc-line text-cc-muted"} disabled:opacity-50`}
              >
                ${n} steps
              </button>
            ))}
          </div>
          <label className="block space-y-1">
            <span className={label}>Deposit into</span>
            <select className="min-h-11 w-full rounded-lg border border-cc-line bg-cc-night/60 px-3" value={target} onChange={(e) => setBucketId(e.target.value)} aria-label="Challenge bucket">
              {state.buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
              <button
                key={w}
                aria-label={`Challenge week ${w}`}
                aria-pressed={done.has(w)}
                onClick={() => (done.has(w) ? actions.challengeUndo(w) : actions.challengeMark(w, target, iso(today())))}
                className={`min-h-11 rounded-md border font-mono text-xs ${done.has(w) ? "border-cc-aqua bg-cc-aqua/25 text-cc-aqua" : "border-cc-line text-cc-muted"}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/** One-tap deposits. Pay yourself first. */
export function PayFirst({ state, actions }: { state: State; actions: Actions }) {
  if (state.buckets.length === 0) return null;
  return (
    <Card tone="lime" className="space-y-3">
      <div>
        <Heading tone="lime">Pay yourself first</Heading>
        <p className="text-xs text-cc-muted">Tap an amount to move it into a bucket today.</p>
      </div>
      {state.buckets.slice(0, 4).map((b) => (
        <div key={b.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate">
              {bucketIcon(b.name)} {b.name}
            </span>
            <span className="font-cc text-lg text-cc-lime">{money(b.contributions.reduce((a, c) => a + c.amount, 0))}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[5, 20, 50, 100].map((n) => (
              <button
                key={n}
                aria-label={`Add ${n} to ${b.name}`}
                onClick={() => actions.contribute(b.id, n, iso(today()))}
                className="min-h-11 rounded-lg border border-cc-line bg-cc-night/40 font-mono text-xs text-cc-snow active:scale-95"
              >
                +${n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </Card>
  );
}
