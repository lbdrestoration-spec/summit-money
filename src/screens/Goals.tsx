import { useState } from "react";
import { addDays, bucketSaved, daysBetween, iso, money, parse, today } from "../calc";
import { bucketIcon, bucketPhoto } from "../bucketIcon";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Empty, Heading, Progress, input, label } from "../ui";
import { BudgetCards, Checklist, Journal, RankCard, TrophyCase } from "./Trail";

export function Goals({ state, actions }: { state: State; actions: Actions }) {
  const goals = state.buckets.filter((b) => b.target);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <RankCard state={state} />
      <Heading tone="gold">Goals</Heading>
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
            <Progress value={pct} tone={pct >= 1 ? "lime" : "gold"} />
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
