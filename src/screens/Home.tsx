import { bucketSaved, money, monthStats, savingsSeries, streak, today, iso } from "../calc";
import { StockChart } from "../Chart";
import type { Actions } from "../store";
import type { State } from "../types";
import { ForestRidge } from "../mountain";
import { rankOf } from "../rank";
import { Button, Card, Empty, Heading, label, Stat } from "../ui";
import { Timeline, WhatIf } from "./Insights";
import { Urge } from "./Urge";
import { DeadlineCards, FridayPayCard } from "./Deadlines";

export function Home({ state, actions, onCasino }: { state: State; actions: Actions; onCasino: () => void }) {
  const m = monthStats(state);
  const series = savingsSeries(state);
  const totalSaved = state.buckets.reduce((a, b) => a + bucketSaved(b), 0);
  const days = streak(state);
  const todayIso = iso(today());
  const checkedToday = state.checkins.includes(todayIso) || state.spends.some((s) => s.date === todayIso);
  const nextPay = m.checks.find((c) => c.date >= todayIso);
  const over = m.remaining < 0;
  const daily = (state.plan?.weeklySpending ?? 0) / 7;
  const report = over ? "Closed, avalanche danger" : daily > 0 && m.safeToday >= daily * 1.2 ? "Fresh powder" : daily > 0 && m.safeToday >= daily * 0.8 ? "Groomed corduroy" : "Thin cover, ski easy";
  const rank = rankOf(state);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-cc-line bg-gradient-to-b from-cc-panel to-cc-deep p-4 pb-28 rise">
        <div className={label}>Safe to spend today</div>
        <div className={`font-cc text-6xl font-bold leading-none ${over ? "text-cc-pink" : "text-cc-lime"}`}>{money(m.safeToday)}</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cc-aqua">Mountain report · {report}</div>
        <div className="mt-1 text-xs text-cc-muted">
          {over ? `Over budget by ${money(-m.remaining)} this month` : `${money(m.remaining)} left this month · ${m.daysLeft} days to go`}
        </div>
        <ForestRidge />
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">
        {rank.cur.mark} {rank.cur.name}
        {rank.next ? ` · ${money(rank.next.at - rank.saved)} to ${rank.next.name}` : ""}
      </div>

      <DeadlineCards state={state} />
      <FridayPayCard state={state} actions={actions} />
      <WhatIf state={state} />
      <Timeline state={state} />

      <div className="grid grid-cols-2 gap-3">
        <Card tone="orange">
          <Stat title="Streak" value={`${days} day${days === 1 ? "" : "s"}`} tone="orange" hint={checkedToday ? "Logged today" : "Log today to keep it"} />
        </Card>
        <Card tone="violet">
          <Stat title="Next payday" value={nextPay ? money(nextPay.amount) : "—"} tone="violet" hint={nextPay ? nextPay.date : "None left this month"} />
        </Card>
      </div>

      {!checkedToday && (
        <Button variant="ghost" className="w-full" onClick={() => actions.checkin(todayIso)}>
          Log a no-spend day
        </Button>
      )}

      <Urge state={state} actions={actions} onCasino={onCasino} />

      <Card tone="lime">
        <div className="mb-2 flex items-end justify-between">
          <Heading tone="lime">Saved this year</Heading>
          <div className="font-cc text-3xl font-semibold text-cc-lime">{money(totalSaved)}</div>
        </div>
        {totalSaved > 0 ? <StockChart series={series} /> : <Empty>Add your first savings bucket on the Plan tab, then put money in it. Your line starts here.</Empty>}
      </Card>

      <Card>
        <Heading tone="aqua">This month</Heading>
        <div className="mt-3 grid grid-cols-2 gap-y-3">
          <Stat title="Wed paychecks" value={money(m.paychecks)} />
          <Stat title="Friday pay" value={money(m.weekly)} />
          <Stat title="Side income" value={money(m.sideIncome)} />
          <Stat title="Bills" value={money(m.bills)} tone="pink" />
          <Stat title="Planned savings" value={money(m.plannedSavings)} tone="gold" />
          <Stat title="Spent" value={money(m.spent)} tone="orange" />
          <Stat title="Left" value={money(m.remaining)} tone={over ? "pink" : "lime"} />
        </div>
      </Card>
    </div>
  );
}
