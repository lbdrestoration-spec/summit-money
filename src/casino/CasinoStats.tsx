import { Card, Heading, label } from "../ui";
import type { CStats } from "./cstats";

export function CasinoStats({ stats }: { stats: CStats }) {
  const items: [string, string][] = [
    ["Biggest payout", stats.biggest.toLocaleString()],
    ["Payouts", stats.payouts.toLocaleString()],
    ["Big wins (500+)", stats.bigWins.toLocaleString()],
    ["Best visit", `+${stats.bestVisit.toLocaleString()}`],
  ];
  return (
    <Card>
      <Heading tone="gold">Your highs</Heading>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.map(([k, v]) => (
          <div key={k}>
            <div className={label}>{k}</div>
            <div className="font-cc text-2xl text-cc-gold">{v}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
