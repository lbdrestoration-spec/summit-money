import { money, parse } from "../calc";
import { records } from "../records";
import type { State } from "../types";
import { Card, Heading, label } from "../ui";

const when = (d: string) => parse(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Your personal bests so far. */
export function Records({ state }: { state: State }) {
  const r = records(state);
  if (!r.bestWeek && r.longestStreak === 0) return null;
  return (
    <Card tone="gold" className="space-y-3" photo="/art/bests.webp">
      <Heading tone="gold">Personal bests</Heading>
      <div className="grid grid-cols-2 gap-3">
        {r.bestWeek && (
          <div>
            <div className={label}>Best saving week</div>
            <div className="font-cc text-2xl text-cc-gold">{money(r.bestWeek.amount)}</div>
            <div className="text-[10px] text-cc-muted">week of {when(r.bestWeek.weekStart)}</div>
          </div>
        )}
        {r.biggestDeposit && (
          <div>
            <div className={label}>Biggest deposit</div>
            <div className="font-cc text-2xl text-cc-gold">{money(r.biggestDeposit.amount)}</div>
            <div className="text-[10px] text-cc-muted">
              {r.biggestDeposit.goal}, {when(r.biggestDeposit.date)}
            </div>
          </div>
        )}
        <div>
          <div className={label}>Longest log streak</div>
          <div className="font-cc text-2xl text-cc-gold">{r.longestStreak} days</div>
        </div>
        <div>
          <div className={label}>Saved so far</div>
          <div className="font-cc text-2xl text-cc-lime">{money(r.totalSaved)}</div>
        </div>
      </div>
    </Card>
  );
}
