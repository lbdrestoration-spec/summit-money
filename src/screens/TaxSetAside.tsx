import { iso, money, today } from "../calc";
import { setAside } from "../tax";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, input, label } from "../ui";

/** A simple set-aside estimate for side income. A planning aid, not tax advice. */
export function TaxSetAside({ state, actions }: { state: State; actions: Actions }) {
  const now = today();
  const r = setAside(state.incomes, state.buckets, state.taxRate, iso(now).slice(0, 7));
  if (state.incomes.length === 0) return null;
  return (
    <Card tone="gold" className="space-y-3">
      <Heading tone="gold">Tax set-aside</Heading>
      <label className="flex items-center gap-2 text-sm">
        <span className={label}>Set aside</span>
        <input className={`${input} w-20`} inputMode="decimal" aria-label="Tax set-aside percent" defaultValue={state.taxRate} onBlur={(e) => actions.setTaxRate(Number(e.target.value))} />
        <span className="text-cc-muted">% of side income</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={label}>Side income this month</div>
          <div className="font-cc text-2xl">{money(r.income, { cents: true })}</div>
        </div>
        <div>
          <div className={label}>Set aside so far</div>
          <div className="font-cc text-2xl text-cc-lime">{money(r.moved, { cents: true })}</div>
        </div>
      </div>
      <p className="text-sm" aria-live="polite">
        {r.income === 0
          ? "No side income logged this month."
          : r.remaining > 0
            ? `Still to set aside this month: ${money(r.remaining, { cents: true })}.`
            : "You've set aside enough for this month."}
      </p>
      {r.remaining > 0 && r.bucket && (
        <Button variant="lime" className="w-full" onClick={() => actions.contribute((r.bucket as { id: string }).id, r.remaining, iso(now))}>
          Move {money(r.remaining, { cents: true })} to {r.bucket.name}
        </Button>
      )}
      {r.remaining > 0 && !r.bucket && <p className="text-xs text-cc-muted">Make a bucket with "Tax" in its name and I can move the money for you.</p>}
      <p className="text-xs text-cc-muted">This is a rough planning number, not tax advice. Check the right percent with a tax pro.</p>
    </Card>
  );
}
