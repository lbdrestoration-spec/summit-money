import { useState } from "react";
import { iso, money, today } from "../calc";
import type { Actions } from "../store";
import { splitWindfall } from "../windfall";
import type { State } from "../types";
import { Button, Card, Heading, input, label } from "../ui";

/** Got a lump sum? See how it would fill your goals, then apply it with one tap. */
export function Windfall({ state, actions }: { state: State; actions: Actions }) {
  const [raw, setRaw] = useState("");
  const [done, setDone] = useState("");
  const amount = Number(raw);
  const { slices, left } = splitWindfall(state, amount);
  return (
    <Card tone="lime" className="space-y-3" photo="/art/windfall.webp">
      <Heading tone="lime">Windfall split</Heading>
      <label className="block space-y-1">
        <span className={label}>Lump sum (refund, gift, bonus)</span>
        <input className={input} inputMode="decimal" placeholder="e.g. 600" value={raw} aria-label="Windfall amount" onChange={(e) => { setRaw(e.target.value); setDone(""); }} />
      </label>
      {amount > 0 && (
        <div className="space-y-2" aria-live="polite">
          {slices.length === 0 ? (
            <p className="text-sm text-cc-muted">None of your goals has a target to fill yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {slices.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-cc text-lg text-cc-lime">{money(s.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          {left > 0 && <p className="text-xs text-cc-muted">{money(left)} is left over after your goals are full.</p>}
          {slices.length > 0 && (
            <Button
              variant="lime"
              className="w-full"
              onClick={() => {
                const d = iso(today());
                for (const s of slices) actions.contribute(s.id, s.amount, d);
                setDone(`Added ${money(slices.reduce((a, s) => a + s.amount, 0))} to your goals.`);
                setRaw("");
              }}
            >
              Put it in my goals
            </Button>
          )}
        </div>
      )}
      {done && <p className="text-sm text-cc-lime" role="status">{done}</p>}
    </Card>
  );
}
