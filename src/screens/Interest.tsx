import { bucketSaved, money } from "../calc";
import { futureValue, interestEarned } from "../interest";
import type { Actions } from "../store";
import type { State } from "../types";
import { Card, Heading, input, label } from "../ui";

/** What your savings could earn in a year at the rate you pick. An estimate, not a promise. */
export function Interest({ state, actions }: { state: State; actions: Actions }) {
  const balance = state.buckets.reduce((a, b) => a + bucketSaved(b), 0);
  const monthly = state.buckets.reduce((a, b) => a + b.monthlyPlan, 0);
  if (state.buckets.length === 0) return null;
  const earned = interestEarned(balance, monthly, state.apy);
  const total = futureValue(balance, monthly, state.apy);
  return (
    <Card tone="lime" className="space-y-3">
      <Heading tone="lime">Interest estimate</Heading>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className={label}>Rate</span>
          <input
            className={`${input} w-24`}
            inputMode="decimal"
            aria-label="Yearly interest rate percent"
            defaultValue={state.apy}
            onBlur={(e) => actions.setApy(Number(e.target.value))}
          />
          <span className="text-cc-muted">% a year</span>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="font-cc text-3xl font-bold text-cc-lime">+{money(earned)}</div>
          <div className={label}>Interest in 12 months</div>
        </div>
        <div>
          <div className="font-cc text-3xl font-bold">{money(total)}</div>
          <div className={label}>Total in 12 months</div>
        </div>
      </div>
      <p className="text-xs text-cc-muted">Uses what you have saved plus your monthly bucket plans. Check the real rate at your bank.</p>
    </Card>
  );
}
