import { useState } from "react";
import { money } from "../calc";
import type { State } from "../types";
import { Card, Heading, label } from "../ui";

/** What each monthly bill adds up to over a year, biggest first. Tap one to see what dropping it would free up. */
export function BillsYear({ state }: { state: State }) {
  const [pick, setPick] = useState<string | null>(null);
  if (state.bills.length === 0) return null;
  const rows = [...state.bills].sort((a, b) => b.amount - a.amount);
  const monthly = rows.reduce((a, b) => a + b.amount, 0);
  const chosen = rows.find((b) => b.id === pick);
  return (
    <Card tone="orange" className="space-y-3">
      <Heading tone="orange">Bills per year</Heading>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-cc text-3xl text-cc-orange">{money(monthly * 12)}</div>
          <div className={label}>a year · {money(monthly)} a month</div>
        </div>
      </div>
      <ul className="space-y-1">
        {rows.map((b) => (
          <li key={b.id}>
            <button
              aria-pressed={pick === b.id}
              onClick={() => setPick(pick === b.id ? null : b.id)}
              className={`flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-left text-sm ${pick === b.id ? "border-cc-orange bg-cc-orange/10" : "border-cc-line"}`}
            >
              <span>{b.name}</span>
              <span className="font-mono text-cc-muted">{money(b.amount * 12)}/yr</span>
            </button>
          </li>
        ))}
      </ul>
      {chosen && (
        <p className="text-sm" aria-live="polite">
          Dropping {chosen.name} would free up {money(chosen.amount * 12)} a year, about {money(chosen.amount * 12 / 52)} a week to save.
        </p>
      )}
    </Card>
  );
}
