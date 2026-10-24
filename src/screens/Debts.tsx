import { useState } from "react";
import { money } from "../calc";
import { payoff } from "../debt";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Empty, Heading, input, label } from "../ui";

const when = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

/** Debt payoff planner: when each balance clears, what it costs, and what an extra payment saves. */
export function Debts({ state, actions }: { state: State; actions: Actions }) {
  const [name, setName] = useState("");
  const [bal, setBal] = useState("");
  const [apr, setApr] = useState("");
  const [pay, setPay] = useState("");
  const ok = name.trim() && Number(bal) > 0 && Number(pay) > 0;
  return (
    <Card tone="pink" className="space-y-3">
      <Heading tone="pink">Debt payoff</Heading>
      {state.debts.length === 0 && <Empty>Add a balance, its rate and what you pay each month. You'll see the payoff date and what an extra $50 saves.</Empty>}
      {state.debts.map((d) => {
        const base = payoff(d.balance, d.apr, d.payment);
        const more = payoff(d.balance, d.apr, d.payment + 50);
        return (
          <div key={d.id} className="space-y-1 rounded-xl border border-cc-line/70 bg-cc-night/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{d.name}</div>
                <div className={label}>
                  {money(d.balance)} at {d.apr}% · {money(d.payment)} a month
                </div>
              </div>
              <button className="min-h-11 px-2 font-mono text-[10px] uppercase text-cc-muted" aria-label={`Remove debt ${d.name}`} onClick={() => actions.removeDebt(d.id)}>
                Remove
              </button>
            </div>
            {base ? (
              <p className="text-sm">
                Debt-free {when(base.months)} ({base.months} months), {money(base.interest)} in interest.
                {more && more.months < base.months && (
                  <span className="text-cc-lime">
                    {" "}
                    Add $50 a month: {base.months - more.months} months sooner, saves {money(base.interest - more.interest)}.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-cc-pink">That payment doesn't cover the interest. Raise it to start shrinking the balance.</p>
            )}
          </div>
        );
      })}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok) return;
          actions.addDebt(name, Number(bal), Number(apr) || 0, Number(pay));
          setName("");
          setBal("");
          setApr("");
          setPay("");
        }}
      >
        <input className={input} placeholder="Name (card, truck loan...)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Debt name" />
        <div className="grid grid-cols-3 gap-2">
          <input className={input} inputMode="decimal" placeholder="Balance" value={bal} onChange={(e) => setBal(e.target.value)} aria-label="Debt balance" />
          <input className={input} inputMode="decimal" placeholder="APR %" value={apr} onChange={(e) => setApr(e.target.value)} aria-label="Debt APR percent" />
          <input className={input} inputMode="decimal" placeholder="Per month" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Debt monthly payment" />
        </div>
        <Button type="submit" className="w-full" disabled={!ok}>
          Add debt
        </Button>
      </form>
    </Card>
  );
}
