import { iso, money, today } from "../calc";
import { seasonStats } from "../snow";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, label } from "../ui";

/** Count your days on snow this season, and see what each one cost. */
export function SnowDays({ state, actions }: { state: State; actions: Actions }) {
  const now = today();
  const t = iso(now);
  const rode = state.rides.includes(t);
  const st = seasonStats(state.rides, state.spends, now);
  return (
    <Card tone="aqua" className="space-y-3" photo="/art/snowdays.webp">
      <Heading tone="aqua">Days on snow</Heading>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-cc text-4xl font-bold leading-none">{st.days}</div>
          <div className={label}>this season</div>
        </div>
        {st.perDay !== null && (
          <div className="text-right">
            <div className="font-cc text-2xl text-cc-gold">{money(st.perDay)}</div>
            <div className={label}>per day so far</div>
          </div>
        )}
      </div>
      <Button className="w-full" variant={rode ? "ghost" : "lime"} aria-pressed={rode} onClick={() => actions.toggleRide(t)}>
        {rode ? "Undo: I rode today" : "I rode today"}
      </Button>
      <p className="text-xs text-cc-muted">Per day uses spends this season in categories or notes that mention lift, ski, snow, board or pass.</p>
    </Card>
  );
}
