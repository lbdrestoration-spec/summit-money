import { readiness } from "../trip";
import type { State } from "../types";
import { Card, Heading, Progress, label } from "../ui";

/** How ready you are for the ski trip: money, checklist and prep in one number. Shows in the last 60 days before it. */
export function TripReady({ state }: { state: State }) {
  const r = readiness(state);
  if (r.days < 0 || r.days > 60) return null;
  return (
    <Card tone="violet" className="space-y-3">
      <div className="flex items-end justify-between">
        <Heading tone="violet">Trip readiness</Heading>
        <div className="font-cc text-3xl text-cc-violet">{r.pct}%</div>
      </div>
      <div className={label}>
        {r.trip.name} · {r.days} day{r.days === 1 ? "" : "s"} to go
      </div>
      <div className="space-y-2">
        {r.parts.map((x) => (
          <div key={x.name} className="space-y-1">
            <div className="flex justify-between text-xs text-cc-muted">
              <span>{x.name}</span>
              <span>{Math.round(x.value * 100)}%</span>
            </div>
            <Progress value={x.value} tone="violet" name={`${x.name} readiness`} />
          </div>
        ))}
      </div>
      <p className="text-xs text-cc-muted">Money compares what you are on track to have to your trip goal. Checklist is the six ride items. Prep counts the last two weeks of circuits.</p>
    </Card>
  );
}
