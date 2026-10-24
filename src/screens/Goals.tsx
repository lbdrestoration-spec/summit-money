import { useState } from "react";
import { addDays, bucketSaved, daysBetween, iso, money, parse, today } from "../calc";
import { bucketIcon, bucketPhoto } from "../bucketIcon";
import type { Actions } from "../store";
import type { Bucket, State } from "../types";
import { Button, Card, Empty, PhotoHeader, Progress, input, label } from "../ui";
import { BudgetCards, Checklist, Journal, RankCard, TrophyCase } from "./Trail";

/** Balance over time for one goal, plus its latest deposits. */
function GoalHistory({ bucket }: { bucket: Bucket }) {
  const [open, setOpen] = useState(false);
  const sorted = [...bucket.contributions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (sorted.length === 0) return null;
  let run = 0;
  const pts = sorted.map((c) => (run += c.amount));
  const max = Math.max(...pts, bucket.target ?? 0, 1);
  const W = 300;
  const H = 70;
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W},${H - (Math.max(0, v) / max) * (H - 6) - 3}`).join(" ");
  return (
    <div className="space-y-2">
      <button className="min-h-11 font-mono text-[10px] uppercase tracking-wider text-cc-aqua" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? "Hide" : "Show"} history for ${bucket.name}`}>
        {open ? "Hide history" : `History · ${sorted.length} entr${sorted.length === 1 ? "y" : "ies"}`}
      </button>
      {open && (
        <div className="space-y-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-full" role="img" aria-label={`${bucket.name} balance over time`}>
            {bucket.target ? <line x1="0" x2={W} y1={H - (bucket.target / max) * (H - 6) - 3} y2={H - (bucket.target / max) * (H - 6) - 3} stroke="var(--color-cc-gold)" strokeDasharray="4 4" strokeWidth="1" opacity="0.7" /> : null}
            <path d={path} fill="none" stroke="var(--color-cc-lime)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="space-y-1">
            {[...sorted].reverse().slice(0, 6).map((c) => (
              <div key={c.id} className="flex justify-between font-mono text-[11px] text-cc-muted">
                <span>{c.date}</span>
                <span className={c.amount < 0 ? "text-cc-orange" : "text-cc-lime"}>
                  {c.amount < 0 ? "−" : "+"}
                  {money(Math.abs(c.amount), { cents: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Sort = "plan" | "close" | "date";
const SORTS: { id: Sort; label: string }[] = [
  { id: "plan", label: "My order" },
  { id: "close", label: "Closest to done" },
  { id: "date", label: "Soonest date" },
];

export function sortGoals(goals: Bucket[], by: Sort): Bucket[] {
  const g = [...goals];
  if (by === "close") g.sort((a, b) => bucketSaved(b) / (b.target as number) - bucketSaved(a) / (a.target as number));
  if (by === "date") g.sort((a, b) => (a.targetDate ?? "9999-12-31") < (b.targetDate ?? "9999-12-31") ? -1 : (a.targetDate ?? "9999-12-31") > (b.targetDate ?? "9999-12-31") ? 1 : 0);
  return g;
}

export function Goals({ state, actions }: { state: State; actions: Actions }) {
  const [sort, setSort] = useState<Sort>("plan");
  const goals = sortGoals(
    state.buckets.filter((b) => b.target),
    sort,
  );
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <RankCard state={state} />
      <PhotoHeader src="/art/tab-goals.webp" video="/art/tab-goals-loop.mp4" title="Goals" sub="Every bucket, one summit" />
      {goals.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sort goals">
          {SORTS.map((x) => (
            <button
              key={x.id}
              aria-pressed={sort === x.id}
              onClick={() => setSort(x.id)}
              className={`min-h-11 rounded-full border px-3 font-mono text-[10px] uppercase tracking-wider ${sort === x.id ? "border-cc-gold bg-cc-gold/15 text-cc-gold" : "border-cc-line text-cc-muted"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
      {goals.length === 0 && <Empty>No goals yet. On the Plan tab, add a savings bucket with a target amount and it shows up here.</Empty>}
      {goals.map((g, gi) => {
        const saved = bucketSaved(g);
        const pct = saved / (g.target as number);
        const left = Math.max(0, (g.target as number) - saved);
        const daysLeft = g.targetDate ? daysBetween(today(), parse(g.targetDate)) : null;
        const perWeek = daysLeft && daysLeft > 0 ? left / Math.max(1, daysLeft / 7) : null;
        const since = iso(addDays(today(), -56));
        const myWeekly = g.contributions.filter((c) => c.date >= since).reduce((a, c) => a + c.amount, 0) / 8;
        const etaDays = left > 0 && myWeekly > 0 ? Math.ceil((left / myWeekly) * 7) : null;
        const etaDate = etaDays !== null ? addDays(today(), etaDays) : null;
        const onPace = etaDate && g.targetDate ? iso(etaDate) <= g.targetDate : null;
        return (
          <Card key={g.id} tone={pct >= 1 ? "lime" : "gold"} className="space-y-3" photo={bucketPhoto(g.name, gi)}>
            <div className="flex items-end justify-between gap-2">
              <div className="font-cc text-2xl font-semibold uppercase">
                {bucketIcon(g.name)} {g.name}
              </div>
              <div className="font-cc text-xl text-cc-gold">
                {money(saved)} <span className="text-cc-muted">/ {money(g.target as number)}</span>
              </div>
            </div>
            <Progress value={pct} tone={pct >= 1 ? "lime" : "gold"} name={`${g.name} goal progress`} />
            <div className="text-xs text-cc-muted">
              {pct >= 1
                ? "Goal reached. Nice work."
                : perWeek
                  ? `${money(left)} to go · about ${money(perWeek)}/week to hit ${parse(g.targetDate as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : `${money(left)} to go`}
            </div>
            {pct < 1 && (
              <div className={`text-xs ${onPace === null ? "text-cc-muted" : onPace ? "text-cc-lime" : "text-cc-orange"}`}>
                {etaDate
                  ? `At ${money(myWeekly)}/week lately, you finish around ${etaDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}${onPace === null ? "." : onPace ? ". On pace." : ". Behind pace, add a little more."}`
                  : "No deposits in the last 8 weeks. Add some and I'll show when you'll finish."}
              </div>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(amounts[g.id]);
                if (n > 0) {
                  actions.contribute(g.id, n, iso(today()));
                  setAmounts((a) => ({ ...a, [g.id]: "" }));
                }
              }}
            >
              <label className="sr-only" htmlFor={`add-${g.id}`}>
                Add to {g.name}
              </label>
              <input id={`add-${g.id}`} className={input} inputMode="decimal" placeholder="Add money" value={amounts[g.id] ?? ""} onChange={(e) => setAmounts((a) => ({ ...a, [g.id]: e.target.value }))} />
              <Button variant="lime" type="submit">
                Add
              </Button>
            </form>
            <GoalHistory bucket={g} />
            <span className={label}>Saved so far counts toward your yearly line on Home</span>
          </Card>
        );
      })}
      <BudgetCards state={state} actions={actions} />
      <Checklist state={state} actions={actions} />
      <TrophyCase state={state} />
      <Journal state={state} actions={actions} />
    </div>
  );
}
