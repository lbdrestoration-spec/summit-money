import { money, streak, weekStats } from "../calc";
import { WeekBars } from "../Chart";
import { useState } from "react";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Empty, Heading, Progress, Stat, input, label, toneBar } from "../ui";

const palette = ["orange", "aqua", "violet", "pink", "gold", "lime"] as const;

function Limits({ state, actions, spentBy }: { state: State; actions: Actions; spentBy: Map<string, number> }) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  return (
    <Card tone="orange" className="space-y-3">
      <div>
        <Heading tone="orange">Category limits</Heading>
        <p className="text-xs text-cc-muted">Set a weekly limit for any category. The bar fills as you spend.</p>
      </div>
      <div className="space-y-3">
        {state.categories.map((c) => {
          const limit = state.catLimits[c];
          const spent = spentBy.get(c) ?? 0;
          const over = limit ? spent > limit : false;
          return (
            <div key={c} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{c}</span>
                <form
                  className="flex items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Number(draft[c]);
                    actions.setLimit(c, draft[c]?.trim() === "" ? null : n);
                    setDraft((d) => ({ ...d, [c]: "" }));
                  }}
                >
                  <span className="text-cc-muted">$</span>
                  <input
                    className={`${input} !w-20 !px-2 !py-1.5 text-right`}
                    inputMode="decimal"
                    placeholder={limit ? String(limit) : "none"}
                    aria-label={`Weekly limit for ${c}`}
                    value={draft[c] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [c]: e.target.value }))}
                  />
                  <Button type="submit" className="!min-h-9 !px-3">
                    Set
                  </Button>
                </form>
              </div>
              {limit ? (
                <>
                  <Progress value={spent / limit} tone={over ? "pink" : "orange"} />
                  <div className={`${label} ${over ? "!text-cc-pink" : ""}`}>
                    {money(spent)} of {money(limit)}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function Week({ state, actions }: { state: State; actions: Actions }) {
  const w = weekStats(state);
  const days = streak(state);
  const pct = w.weeklyAllowance > 0 ? w.spent / w.weeklyAllowance : w.spent > 0 ? 1 : 0;
  const over = w.spent > w.weeklyAllowance;
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="space-y-4">
      <Card tone="aqua">
        <Heading>Weekly rundown</Heading>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">
          {fmt(w.from)} – {fmt(w.to)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat title="Spent" value={money(w.spent)} tone="orange" />
          <Stat title="Earned" value={money(w.income)} tone="lime" hint="side income" />
          <Stat title="Saved" value={money(w.saved)} tone="gold" />
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-cc-muted">
            <span>Weekly allowance</span>
            <span className={over ? "text-cc-pink" : ""}>
              {money(w.spent)} of {money(w.weeklyAllowance)}
            </span>
          </div>
          <Progress value={pct} tone={over ? "pink" : "lime"} />
        </div>
      </Card>

      <Card>
        <Heading tone="orange">Day by day</Heading>
        <div className="mt-3">
          <WeekBars days={w.days} />
        </div>
        <p className="mt-2 text-xs text-cc-muted">
          {w.days.filter((d) => d.logged).length} of 7 days logged · current streak {days}
        </p>
      </Card>

      <Card>
        <Heading tone="violet">Where it went</Heading>
        <div className="mt-3 space-y-3">
          {w.byCategory.length === 0 && <Empty>No spending logged this week.</Empty>}
          {w.byCategory.map(([name, amt], i) => (
            <div key={name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="font-cc text-lg">{money(amt)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cc-night/80">
                <div className={`h-full rounded-full ${toneBar[palette[i % palette.length]]}`} style={{ width: `${(amt / w.spent) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Button
        variant="primary"
        className="w-full"
        onClick={async () => {
          const text = `My week (${fmt(w.from)} to ${fmt(w.to)}): spent ${money(w.spent)} of ${money(w.weeklyAllowance)}, saved ${money(w.saved)}, ${days}-day streak.`;
          try {
            if (navigator.share) await navigator.share({ title: "Summit Money week", text });
            else await navigator.clipboard.writeText(text);
          } catch {
            /* cancelled */
          }
        }}
      >
        Share my week
      </Button>
      <Limits state={state} actions={actions} spentBy={new Map(w.byCategory)} />
    </div>
  );
}
