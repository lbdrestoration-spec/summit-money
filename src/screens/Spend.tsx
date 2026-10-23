import { useState } from "react";
import { iso, money, parse, today } from "../calc";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Empty, Heading, input, label } from "../ui";

export function Spend({ state, actions }: { state: State; actions: Actions }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(state.categories[0] ?? "Other");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(iso(today()));
  const valid = Number(amount) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    actions.addSpend({ amount: Number(amount), category, note: note.trim(), date });
    setAmount("");
    setNote("");
  }

  return (
    <div className="space-y-4">
      <Card tone="orange">
        <Heading tone="orange">Log spending</Heading>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <input className={`${input} font-cc text-3xl`} inputMode="decimal" placeholder="$0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
          <div className="flex gap-2" role="group" aria-label="Quick add">
            {[5, 10, 20, 50].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setAmount(String((Number(amount) || 0) + n))}
                className="min-h-11 flex-1 rounded-lg border border-cc-line bg-cc-night/40 font-cc text-lg text-cc-snow active:border-cc-orange"
              >
                +{n}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {state.categories.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`min-h-10 rounded-full border px-3 text-sm ${category === c ? "border-cc-orange bg-cc-orange/20 text-cc-orange" : "border-cc-line text-cc-muted"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <input className={input} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <label className="block space-y-1">
            <span className={label}>Date</span>
            <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <Button variant="primary" className="w-full" disabled={!valid} type="submit">
            Add it
          </Button>
        </form>
      </Card>

      <Card>
        <Heading>Recent</Heading>
        <div className="mt-3 space-y-2">
          {state.spends.length === 0 && <Empty>Nothing logged yet.</Empty>}
          {state.spends.slice(0, 30).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm">{s.note || s.category}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-cc-muted">
                  {s.category} · {parse(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-cc text-xl text-cc-orange">{money(s.amount, { cents: true })}</span>
                <button className="min-h-11 min-w-11 text-cc-muted" onClick={() => actions.removeSpend(s.id)} aria-label="Delete">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
