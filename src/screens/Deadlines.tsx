import { useState } from "react";
import { addDays, fridaysBetween, iso, money, parse, today } from "../calc";
import { projectTo } from "../plan";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, Progress, input, label } from "../ui";

const fmt = (d: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) => parse(d).toLocaleDateString("en-US", opts);

/** "How much will I have saved by..." cards. These move when a Friday pays less. */
export function DeadlineCards({ state }: { state: State }) {
  const cards = (state.plan?.deadlines ?? []).map((d) => ({ d, p: projectTo(state, d) })).filter((x) => x.p);
  return (
    <>
      {cards.map(({ d, p }) => {
        if (!p) return null;
        const short = p.goalGap !== null && p.goalGap < 0;
        const tone = p.projected < 0 || short ? "pink" : "lime";
        return (
          <Card key={d.id} tone={tone} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-cc text-2xl font-semibold uppercase">{d.name}</div>
                <div className={label}>
                  {fmt(d.date, { month: "short", day: "numeric", year: "numeric" })} · {p.days} days
                </div>
              </div>
            </div>
            <div className={label}>You'll have saved</div>
            <div className={`font-cc text-5xl font-bold leading-none ${tone === "pink" ? "text-cc-pink" : "text-cc-lime"}`}>{money(p.projected)}</div>
            {d.goal ? (
              <div className="space-y-1">
                <Progress value={p.projected / d.goal} tone={tone} />
                <div className="text-xs text-cc-muted">
                  {short ? `${money(-(p.goalGap as number))} short of your ${money(d.goal)} goal` : `${money(p.goalGap as number)} over your ${money(d.goal)} goal`}
                </div>
              </div>
            ) : null}
            {p.fridayShort > 0 && <div className="text-xs text-cc-orange">Includes {money(p.fridayShort)} less from Fridays you marked short.</div>}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-cc-line/60 pt-2 font-mono text-[10px] uppercase tracking-wider text-cc-muted">
              <span>Wed pay +{money(p.wednesday)}</span>
              <span>Fri pay +{money(p.friday)}</span>
              <span>Bills -{money(p.bills)}</span>
              <span>Spending -{money(p.spending)}</span>
            </div>
          </Card>
        );
      })}
    </>
  );
}

function Row({ date, amount, usual, overridden, past, onSave, onReset }: { date: string; amount: number; usual: number; overridden: boolean; past: boolean; onSave: (n: number) => void; onReset: () => void }) {
  const [v, setV] = useState(String(amount));
  const commit = () => {
    const n = Number(v);
    if (v.trim() !== "" && Number.isFinite(n) && n >= 0) onSave(n);
    else setV(String(amount));
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm">{fmt(date, { weekday: "short", month: "short", day: "numeric" })}</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-cc-muted">{past ? "Paid" : "Coming"}{overridden ? ` · usual ${money(usual)}` : ""}</div>
      </div>
      <div className="flex items-center gap-1">
        {overridden && (
          <button className="min-h-11 px-2 font-mono text-[10px] uppercase tracking-wider text-cc-aqua" onClick={onReset}>
            Reset
          </button>
        )}
        <div className="flex items-center">
          <span className="text-cc-muted">$</span>
          <input
            className={`${input} !w-20 !px-2 text-right ${overridden ? "!border-cc-orange/70" : ""}`}
            inputMode="decimal"
            value={v}
            aria-label={`Pay for Friday ${date}`}
            onChange={(e) => setV(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
        </div>
      </div>
    </div>
  );
}

/** Type what a Friday actually paid. Everything on Home updates. */
export function FridayPayCard({ state, actions }: { state: State; actions: Actions }) {
  const [more, setMore] = useState(false);
  const plan = state.plan;
  if (!plan) return null;
  const now = today();
  const rows = fridaysBetween(plan, addDays(now, -6), addDays(now, more ? 70 : 22));
  const t = iso(now);
  return (
    <Card tone="orange" className="space-y-3">
      <div>
        <Heading tone="orange">Friday pay</Heading>
        <p className="text-xs text-cc-muted">Usual {money(plan.fridayAmount)}. Worked less? Type what you made and your saved-by numbers change.</p>
      </div>
      <div className="space-y-2">
        {rows.map((f) => (
          <Row
            key={`${f.date}-${f.amount}`}
            date={f.date}
            amount={f.amount}
            usual={plan.fridayAmount}
            overridden={f.overridden}
            past={f.date <= t}
            onSave={(n) => actions.setFridayPay(f.date, n)}
            onReset={() => actions.setFridayPay(f.date, null)}
          />
        ))}
      </div>
      <Button className="w-full" onClick={() => setMore(!more)}>
        {more ? "Show fewer weeks" : "Show more weeks"}
      </Button>
    </Card>
  );
}
