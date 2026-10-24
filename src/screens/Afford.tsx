import { useState } from "react";
import { afford, weeklySaving } from "../afford";
import { money } from "../calc";
import type { State } from "../types";
import { Card, Heading, input, label } from "../ui";

/** Think it over: what a purchase costs in weeks of saving, before you buy it. */
export function Afford({ state }: { state: State }) {
  const [raw, setRaw] = useState("");
  const price = Number(raw);
  const rate = weeklySaving(state);
  const r = afford(state, price);
  return (
    <Card tone="gold" className="space-y-3">
      <Heading tone="gold">Think it over</Heading>
      <label className="block space-y-1">
        <span className={label}>Price of the thing</span>
        <input className={input} inputMode="decimal" placeholder="e.g. 250" value={raw} onChange={(e) => setRaw(e.target.value)} aria-label="Price to think over" />
      </label>
      {price > 0 && (
        <div className="space-y-1 text-sm" aria-live="polite">
          {r.weeks !== null ? (
            <p>
              That's about {r.weeks < 1 ? "less than a week" : `${Math.round(r.weeks * 10) / 10} weeks`} of your saving ({money(rate)}/week lately).
            </p>
          ) : (
            <p className="text-cc-muted">No savings in the last 8 weeks, so I can't turn this into weeks yet.</p>
          )}
          {r.goal && (
            <p className="text-cc-orange">
              Buying it pushes {r.goal.name} back about {r.goal.delayDays} day{r.goal.delayDays === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
