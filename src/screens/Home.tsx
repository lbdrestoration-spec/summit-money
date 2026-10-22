import { bucketSaved, money, monthStats, savingsSeries, streak, today, iso } from "../calc";
import { StockChart } from "../Chart";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Empty, Heading, label, Stat } from "../ui";

function Ridge() {
  return (
    <svg viewBox="0 0 400 90" className="absolute inset-x-0 bottom-0 w-full opacity-90" aria-hidden="true" preserveAspectRatio="none">
      <path d="M0 90 L0 62 L70 30 L110 52 L170 12 L230 55 L290 28 L350 58 L400 38 L400 90 Z" fill="var(--color-cc-line)" opacity="0.55" />
      <path d="M0 90 L0 74 L60 52 L120 70 L190 40 L260 72 L330 50 L400 72 L400 90 Z" fill="var(--color-cc-deep)" />
      <path d="M170 12 L186 33 L176 30 L170 42 L163 29 L153 33 Z" fill="var(--color-cc-snow)" opacity="0.9" />
      <path d="M290 28 L302 45 L294 43 L290 52 L285 42 L277 45 Z" fill="var(--color-cc-snow)" opacity="0.8" />
    </svg>
  );
}

export function Home({ state, actions, onCasino }: { state: State; actions: Actions; onCasino: () => void }) {
  const m = monthStats(state);
  const series = savingsSeries(state);
  const totalSaved = state.buckets.reduce((a, b) => a + bucketSaved(b), 0);
  const days = streak(state);
  const todayIso = iso(today());
  const checkedToday = state.checkins.includes(todayIso) || state.spends.some((s) => s.date === todayIso);
  const nextPay = m.checks.find((c) => c.date >= todayIso);
  const over = m.remaining < 0;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-cc-line bg-gradient-to-b from-cc-panel to-cc-deep p-4 pb-20 rise">
        <div className={label}>Safe to spend today</div>
        <div className={`font-cc text-6xl font-bold leading-none ${over ? "text-cc-pink" : "text-cc-lime"}`}>{money(m.safeToday)}</div>
        <div className="mt-1 text-xs text-cc-muted">
          {over ? `Over budget by ${money(-m.remaining)} this month` : `${money(m.remaining)} left this month · ${m.daysLeft} days to go`}
        </div>
        <Ridge />
      </div>

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

      <Card tone="pink" className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-cc text-2xl font-semibold uppercase text-cc-pink">Feeling the urge?</div>
          <div className="text-xs text-cc-muted">Play your chips instead. Real money stays put.</div>
        </div>
        <Button variant="lime" className="shrink-0" onClick={onCasino}>
          Open casino
        </Button>
      </Card>

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
          <Stat title="Paychecks" value={money(m.paychecks)} />
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
