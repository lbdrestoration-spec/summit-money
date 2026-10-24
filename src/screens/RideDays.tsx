import { useState } from "react";
import { weeklySaving } from "../afford";
import { money } from "../calc";
import { perDay, readPlan, savePlan, seasonCost, weeksFor, type DayPlan } from "../rideday";
import type { State } from "../types";
import { Card, Heading, input, label } from "../ui";

const FIELDS: [keyof DayPlan, string][] = [
  ["ticket", "Lift ticket or pass share"],
  ["gas", "Gas"],
  ["food", "Food"],
  ["other", "Other"],
];

/** What a season of ride days costs, in weeks of your recent saving. Numbers are yours; nothing is guessed. */
export function RideDays({ state }: { state: State }) {
  const [plan, setPlan] = useState<DayPlan>(readPlan);
  const set = (k: keyof DayPlan, raw: string) => {
    const v = Number(raw);
    const next = { ...plan, [k]: Number.isFinite(v) && v >= 0 ? v : 0 };
    setPlan(next);
    savePlan(next);
  };
  const cost = seasonCost(plan);
  const weeks = weeksFor(plan, weeklySaving(state));
  return (
    <Card tone="aqua" className="space-y-3">
      <Heading tone="aqua">Ride days</Heading>
      <p className="text-xs text-cc-muted">Put in what one day on the hill costs you. I'll tell you what the season costs in saving weeks.</p>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([k, name]) => (
          <label key={k} className="block space-y-1">
            <span className={label}>{name}</span>
            <input className={input} inputMode="decimal" value={plan[k] ? String(plan[k]) : ""} placeholder="0" onChange={(e) => set(k, e.target.value)} aria-label={name} />
          </label>
        ))}
        <label className="block space-y-1">
          <span className={label}>Days planned</span>
          <input className={input} inputMode="numeric" value={plan.days ? String(plan.days) : ""} placeholder="0" onChange={(e) => set("days", e.target.value)} aria-label="Days planned" />
        </label>
      </div>
      {cost > 0 && (
        <div className="space-y-1 text-sm" aria-live="polite">
          <p>
            One day is {money(perDay(plan))}. {plan.days} days is {money(cost)}.
          </p>
          {weeks !== null ? (
            <p className="text-cc-aqua">That's about {weeks < 1 ? "less than a week" : `${Math.round(weeks * 10) / 10} weeks`} of your recent saving.</p>
          ) : (
            <p className="text-cc-muted">No savings in the last 8 weeks, so I can't turn this into weeks yet.</p>
          )}
        </div>
      )}
    </Card>
  );
}
