import { useState } from "react";
import { addDays, billsBetween, daysBetween, endOfMonth, fridaysBetween, money, monthStats, startOfWeek, parse, paychecksBetween, startOfMonth, today } from "../calc";
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
    .map((b) => ({ b, amt: Math.round((b.monthlyPlan * 12) / PAYDAYS_PER_YEAR), done: b.contributions.some((c) => c.amount > 0 && c.date === t) }))
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
    if (n > todayN) return "border-cc-line/40 text-cc-muted/80";
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
      <Progress value={(total - prev) / (next - prev)} tone="gold" name="Progress to next milestone" />
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
      {planned > 0 && <Progress value={Math.min(1, deposited / planned)} tone="lime" name="Saved this month versus plan" />}
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
      <Progress value={total / goal} tone="aqua" name="52-week challenge progress" />
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

/** Deposits per month for the last six months. */
export function MonthlyBars({ state }: { state: State }) {
  const now = today();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const from = iso(startOfMonth(d));
    const to = iso(endOfMonth(d));
    const v = state.buckets.flatMap((b) => b.contributions).filter((c) => c.date >= from && c.date <= to).reduce((a, c) => a + c.amount, 0);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), v };
  });
  const max = Math.max(...months.map((m) => m.v), 1);
  if (months.every((m) => m.v === 0)) return null;
  const best = months.reduce((a, b) => (b.v > a.v ? b : a));
  return (
    <Card tone="aqua" className="space-y-2">
      <Heading tone="aqua">Month by month</Heading>
      <div className="flex h-32 items-end gap-2" role="img" aria-label={`Savings per month, best month ${best.label} at ${money(best.v)}`}>
        {months.map((m, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="font-mono text-[9px] text-cc-muted">{m.v > 0 ? money(m.v) : ""}</span>
            <div className={`w-full rounded-t-md ${i === 5 ? "bg-cc-lime" : "bg-cc-aqua/60"}`} style={{ height: `${Math.max(m.v > 0 ? 4 : 1, (m.v / max) * 100)}%` }} />
            <span className={label}>{m.label}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-cc-muted">Best month: {best.label}, {money(best.v)}.</div>
    </Card>
  );
}

/** How many months of bills your savings could cover. */
export function BillsCover({ state }: { state: State }) {
  const bills = state.bills.reduce((a, b) => a + b.amount, 0);
  const saved = totalSaved(state);
  if (bills <= 0 || saved <= 0) return null;
  const months = saved / bills;
  const next = Math.floor(months) + 1;
  return (
    <Card tone="violet" className="space-y-2">
      <Heading tone="violet">Bills cushion</Heading>
      <div className="flex items-end justify-between">
        <div className="font-cc text-4xl font-bold text-cc-violet">{months.toFixed(1)} months</div>
        <div className={label}>of bills ({money(bills)}/mo)</div>
      </div>
      <Progress value={months - Math.floor(months)} tone="violet" name="Progress to next month of bills covered" />
      <div className="text-xs text-cc-muted">{money(next * bills - saved)} more covers {next} month{next === 1 ? "" : "s"}. Three to six is the usual safety net.</div>
    </Card>
  );
}

/** What every spend would add if it were rounded up to the next $5. */
export const roundUpTotal = (state: State) => state.spends.reduce((a, s) => a + (Math.ceil(s.amount / 5) * 5 - s.amount), 0);

/** Round-up jar: pretend each spend was rounded up to the next $5, then move the difference into savings. */
export function RoundUpJar({ state, actions }: { state: State; actions: Actions }) {
  const [bucketId, setBucketId] = useState("");
  const jar = Math.max(0, Math.round((roundUpTotal(state) - state.roundMoved) * 100) / 100);
  if (state.spends.length === 0 || state.buckets.length === 0) return null;
  const target = bucketId || state.buckets[0].id;
  return (
    <Card tone="gold" className="space-y-2">
      <Heading tone="gold">Round-up jar</Heading>
      <div className="flex items-end justify-between">
        <div className="font-cc text-4xl font-bold text-cc-gold">{money(jar, { cents: true })}</div>
        <div className={label}>from {state.spends.length} spend{state.spends.length === 1 ? "" : "s"}</div>
      </div>
      <p className="text-xs text-cc-muted">If every spend were rounded up to the next $5, this is the difference. Move it into savings when you really transfer it.</p>
      <div className="flex gap-2">
        <select className="min-h-11 flex-1 rounded-lg border border-cc-line bg-cc-night/60 px-3" value={target} onChange={(e) => setBucketId(e.target.value)} aria-label="Round-up bucket">
          {state.buckets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <Button variant="lime" disabled={jar < 0.01} onClick={() => actions.moveRoundUp(target, jar, iso(today()))}>
          Move {money(jar, { cents: true })}
        </Button>
      </div>
    </Card>
  );
}

/** Last Monday-to-Sunday at a glance: what went into savings, what was spent, how many days you logged. */
export function LastWeek({ state }: { state: State }) {
  const now = today();
  const start = addDays(startOfWeek(now), -7);
  const end = addDays(start, 6);
  const a = iso(start);
  const z = iso(end);
  const saved = state.buckets.flatMap((b) => b.contributions).filter((c) => c.date >= a && c.date <= z).reduce((x, c) => x + c.amount, 0);
  const spent = state.spends.filter((s) => s.date >= a && s.date <= z).reduce((x, s) => x + s.amount, 0);
  const logged = new Set([...state.checkins, ...state.spends.map((s) => s.date)].filter((d) => d >= a && d <= z)).size;
  if (saved === 0 && spent === 0 && logged === 0) return null;
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const verdict = saved > spent ? "You saved more than you spent. That's the goal." : saved > 0 ? "You put money away. Try to beat it this week." : "Nothing went into savings. Fix it with one tap below.";
  return (
    <Card tone="violet" className="space-y-2">
      <Heading tone="violet">Last week</Heading>
      <div className={label}>
        {fmt(start)} to {fmt(end)}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-cc text-3xl font-bold text-cc-lime">{money(saved)}</div>
          <div className={label}>Saved</div>
        </div>
        <div>
          <div className="font-cc text-3xl font-bold text-cc-orange">{money(spent)}</div>
          <div className={label}>Spent</div>
        </div>
        <div>
          <div className="font-cc text-3xl font-bold text-cc-aqua">{logged}/7</div>
          <div className={label}>Days logged</div>
        </div>
      </div>
      <div className="text-xs text-cc-muted">{verdict}</div>
    </Card>
  );
}

/** Shows only when nothing has gone into savings yet this week. One tap puts the usual weekly amount in. */
export function WeekNudge({ state, actions }: { state: State; actions: Actions }) {
  const now = today();
  const from = iso(startOfWeek(now));
  const thisWeek = state.buckets.some((b) => b.contributions.some((c) => c.amount > 0 && c.date >= from && c.date <= iso(now)));
  if (state.buckets.length === 0 || thisWeek) return null;
  const planned = state.buckets.reduce((a, b) => a + b.monthlyPlan, 0);
  const weekly = planned > 0 ? Math.max(5, Math.round((planned * 12) / 52 / 5) * 5) : 20;
  const target = state.buckets.find((b) => b.monthlyPlan > 0) ?? state.buckets[0];
  return (
    <Card tone="orange" className="space-y-2">
      <Heading tone="orange">Nothing saved this week yet</Heading>
      <p className="text-xs text-cc-muted">Keep the saving streak alive. Put the usual {money(weekly)} into {target.name} now.</p>
      <Button variant="lime" className="w-full" onClick={() => actions.contribute(target.id, weekly, iso(today()))}>
        Save {money(weekly)} to {target.name}
      </Button>
    </Card>
  );
}

/** Where you land on Dec 31 if the last 8 weeks of saving simply continue. */
export function YearEnd({ state }: { state: State }) {
  const now = today();
  const end = new Date(now.getFullYear(), 11, 31);
  const left = daysBetween(now, end);
  const total = totalSaved(state);
  const from = iso(addDays(now, -56));
  const recent = state.buckets.flatMap((b) => b.contributions).filter((c) => c.date >= from && c.date <= iso(now)).reduce((a, c) => a + c.amount, 0);
  if (left <= 0 || recent <= 0) return null;
  const projected = total + (recent / 56) * left;
  const perWeek = recent / 8;
  return (
    <Card tone="aqua" className="space-y-1">
      <Heading tone="aqua">Year-end forecast</Heading>
      <div className="flex items-end justify-between">
        <div className="font-cc text-4xl font-bold text-cc-aqua">{money(projected)}</div>
        <div className={label}>by Dec 31 · {left} days</div>
      </div>
      <div className="text-xs text-cc-muted">If you keep saving about {money(perWeek)} a week, like the last 8 weeks. Every extra $10 a week adds about {money((10 * left) / 7)}.</div>
    </Card>
  );
}

/** Twelve weeks of deposit days, like a contribution graph. Darker green means a bigger deposit that day. */
export function SaveHeat({ state }: { state: State }) {
  const now = today();
  const start = addDays(startOfWeek(now), -77);
  const byDay = new Map<string, number>();
  for (const c of state.buckets.flatMap((b) => b.contributions)) byDay.set(c.date, (byDay.get(c.date) ?? 0) + c.amount);
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = addDays(start, i);
    return { iso: iso(d), v: byDay.get(iso(d)) ?? 0, future: d > now };
  });
  const active = days.filter((d) => d.v > 0).length;
  if (active === 0) return null;
  const max = Math.max(...days.map((d) => d.v));
  const shade = (v: number) => (v <= 0 ? "bg-cc-line/50" : v / max > 0.66 ? "bg-cc-lime" : v / max > 0.33 ? "bg-cc-lime/70" : "bg-cc-lime/40");
  return (
    <Card tone="lime" className="space-y-2">
      <Heading tone="lime">Saving days</Heading>
      <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`You put money away on ${active} of the last 12 weeks' days`}>
        {days.map((d) => (
          <div key={d.iso} title={`${d.iso}: ${money(d.v)}`} className={`aspect-square rounded-[3px] ${d.future ? "opacity-0" : shade(d.v)}`} />
        ))}
      </div>
      <div className="text-xs text-cc-muted">{active} saving day{active === 1 ? "" : "s"} in the last 12 weeks. Mondays on top.</div>
    </Card>
  );
}

/** The category taking the most this month, and what a 20% trim would free up for savings. */
export function BiggestLeak({ state }: { state: State }) {
  const now = today();
  const from = iso(startOfMonth(now));
  const to = iso(endOfMonth(now));
  const by = new Map<string, number>();
  for (const s of state.spends) if (s.date >= from && s.date <= to) by.set(s.category, (by.get(s.category) ?? 0) + s.amount);
  const rows = [...by.entries()].sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) return null;
  const [name, amt] = rows[0];
  const total = rows.reduce((a, r) => a + r[1], 0);
  const free = amt * 0.2;
  return (
    <Card tone="orange" className="space-y-2">
      <Heading tone="orange">Biggest leak this month</Heading>
      <div className="flex items-end justify-between">
        <div className="font-cc text-3xl font-bold uppercase text-cc-orange">{name}</div>
        <div className="font-cc text-3xl font-bold">{money(amt)}</div>
      </div>
      <Progress value={total > 0 ? amt / total : 0} tone="orange" name="Share of this month's spending" />
      <div className="text-xs text-cc-muted">
        {Math.round((amt / total) * 100)}% of what you spent. Trim it by 20% and {money(free)} could go to savings, about {money(free * 12)} over a year.
      </div>
    </Card>
  );
}
