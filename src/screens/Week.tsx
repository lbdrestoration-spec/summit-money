import { money, streak, weekStats } from "../calc";
import { WeekBars } from "../Chart";
import type { State } from "../types";
import { Card, Empty, Heading, Progress, Stat, toneBar } from "../ui";

const palette = ["orange", "aqua", "violet", "pink", "gold", "lime"] as const;

export function Week({ state }: { state: State }) {
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
    </div>
  );
}
