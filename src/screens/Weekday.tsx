import { money } from "../calc";
import { priciest, weekdayStats } from "../weekday";
import type { State } from "../types";
import { Card, Heading, label } from "../ui";

/** Which day of the week your spending lands on, over the last 12 weeks. */
export function Weekday({ state }: { state: State }) {
  const stats = weekdayStats(state);
  const top = priciest(stats);
  if (!top) return null;
  const max = Math.max(...stats.map((s) => s.avg), 1);
  return (
    <Card tone="orange" className="space-y-3">
      <Heading tone="orange">Spending by weekday</Heading>
      <p className="text-sm">
        {top.name}s cost you the most: about {money(top.avg)} each lately.
      </p>
      <div className="space-y-1.5">
        {stats.map((s) => (
          <div key={s.day} className="flex items-center gap-2">
            <span className={`w-9 ${label}`}>{s.name.slice(0, 3)}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-cc-line/50">
              <div className={`h-full rounded-full ${s.day === top.day ? "bg-cc-orange" : "bg-cc-aqua/60"}`} style={{ width: `${(s.avg / max) * 100}%` }} />
            </div>
            <span className="w-14 text-right font-mono text-[10px] text-cc-muted">{money(s.avg)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
