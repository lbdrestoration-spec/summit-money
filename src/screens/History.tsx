import { useMemo, useState } from "react";
import { money } from "../calc";
import type { State } from "../types";
import { Button, Card, Empty, Heading, input, label } from "../ui";

type Row = { id: string; date: string; kind: "spend" | "income" | "deposit" | "withdrawal"; amount: number; what: string; note: string };
const KINDS = ["all", "spend", "income", "deposit", "withdrawal"] as const;

/** Every spend, income and bucket move in one searchable list, newest first. */
export function rowsOf(state: State): Row[] {
  return [
    ...state.spends.map((x): Row => ({ id: x.id, date: x.date, kind: "spend", amount: x.amount, what: x.category, note: x.note })),
    ...state.incomes.map((x): Row => ({ id: x.id, date: x.date, kind: "income", amount: x.amount, what: "Income", note: x.note })),
    ...state.buckets.flatMap((b) =>
      b.contributions.map((c): Row => ({ id: c.id, date: c.date, kind: c.amount < 0 ? "withdrawal" : "deposit", amount: Math.abs(c.amount), what: b.name, note: "" })),
    ),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function History({ state }: { state: State }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [q, setQ] = useState("");
  const [more, setMore] = useState(1);
  const all = useMemo(() => rowsOf(state), [state]);
  const shown = all.filter((r) => (kind === "all" || r.kind === kind) && `${r.what} ${r.note}`.toLowerCase().includes(q.trim().toLowerCase()));
  const total = shown.reduce((a, r) => a + r.amount, 0);
  return (
    <Card tone="aqua" className="space-y-3">
      <Heading tone="aqua">History</Heading>
      <input className={input} placeholder="Search notes, categories, buckets" value={q} onChange={(e) => { setQ(e.target.value); setMore(1); }} aria-label="Search history" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter history">
        {KINDS.map((k) => (
          <button
            key={k}
            aria-pressed={kind === k}
            onClick={() => { setKind(k); setMore(1); }}
            className={`min-h-11 rounded-full border px-3 font-mono text-[10px] uppercase tracking-wider ${kind === k ? "border-cc-aqua bg-cc-aqua/15 text-cc-aqua" : "border-cc-line text-cc-muted"}`}
          >
            {k}
          </button>
        ))}
      </div>
      <div className={label}>
        {shown.length} {shown.length === 1 ? "entry" : "entries"} · {money(total)}
      </div>
      {shown.length === 0 && <Empty>Nothing matches. Try a different filter.</Empty>}
      <ul className="space-y-1">
        {shown.slice(0, 20 * more).map((r) => (
          <li key={`${r.kind}-${r.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-cc-line/60 bg-cc-night/40 px-3 py-2 text-sm">
            <span className="min-w-0">
              <span className="block truncate">{r.what}{r.note ? ` · ${r.note}` : ""}</span>
              <span className="font-mono text-[10px] uppercase text-cc-muted">
                {r.date} · {r.kind}
              </span>
            </span>
            <span className={`font-cc text-lg ${r.kind === "spend" || r.kind === "withdrawal" ? "text-cc-pink" : "text-cc-lime"}`}>
              {r.kind === "spend" || r.kind === "withdrawal" ? "-" : "+"}
              {money(r.amount)}
            </span>
          </li>
        ))}
      </ul>
      {shown.length > 20 * more && (
        <Button variant="ghost" className="w-full" onClick={() => setMore(more + 1)}>
          Show more
        </Button>
      )}
    </Card>
  );
}
