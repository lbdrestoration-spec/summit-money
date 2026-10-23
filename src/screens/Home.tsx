import { bucketSaved, money, monthStats, parse, savingsSeries, streak, today, iso } from "../calc";
import { StockChart } from "../Chart";
import type { Actions } from "../store";
import type { State } from "../types";
import { rankOf } from "../rank";
import { Button, Card, Empty, Heading, label, Stat } from "../ui";
import { Countdowns, DueSoon, PaydaySplit, Runway, Timeline, WhatIf } from "./Insights";
import { RunsCard } from "./Trail";
import { Urge } from "./Urge";
import { Weather } from "./Weather";
import { DeadlineCards, FridayPayCard } from "./Deadlines";

const QUOTES = [
  "Fresh tracks come to the ones who show up early.",
  "The mountain doesn't care how you feel. Make the run anyway.",
  "Small turns, every day. That's how you get down a big line.",
  "Cold hands, warm pocket. Keep the cash.",
  "Winter is built in the fall. So is the bankroll.",
  "A steady line beats a wild one.",
  "Every dollar kept is a lift ticket earned.",
  "Pines grow slow and stand through everything.",
  "You don't need the bet. You need the view from the top.",
  "Hold the edge. The urge fades before the run ends.",
];
const quoteOf = (d: string) => QUOTES[[...d].reduce((a, c) => a + c.charCodeAt(0), 0) % QUOTES.length];

function BackupNudge({ state, onPlan }: { state: State; onPlan: () => void }) {
  let last: string | null = null;
  try {
    last = localStorage.getItem("summit-money:lastBackup");
  } catch {
    /* ignore */
  }
  const hasData = state.spends.length + state.checkins.length + state.buckets.reduce((a, b) => a + b.contributions.length, 0) > 0;
  const age = last ? Math.round((today().getTime() - parse(last).getTime()) / 86400000) : null;
  if (!hasData || (age !== null && age < 14)) return null;
  return (
    <Card tone="gold" className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-cc text-xl font-semibold uppercase text-cc-gold">Back up your data</div>
        <div className="text-xs text-cc-muted">{age === null ? "Everything lives on this phone only." : `Last backup was ${age} days ago.`} Save a copy so a reset can't wipe it.</div>
      </div>
      <Button variant="primary" className="shrink-0" onClick={onPlan}>
        Back up
      </Button>
    </Card>
  );
}

export function Home({ state, actions, onCasino, onPlan }: { state: State; actions: Actions; onCasino: () => void; onPlan: () => void }) {
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
      <div className="rise relative min-h-[340px] overflow-hidden rounded-2xl border border-cc-line">
        <img src="/art/hero.webp" alt="Snow-covered pine forest below a pink alpenglow mountain near Whitefish, Montana" className="absolute inset-0 h-full w-full object-cover" />
        <video className="hero-video absolute inset-0 h-full w-full object-cover" src="/art/hero-loop.mp4" poster="/art/hero.webp" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-cc-night via-cc-night/55 to-transparent" />
        <div className="relative flex min-h-[340px] flex-col justify-end p-4">
          <div className={label}>Safe to spend today</div>
          <div className={`font-cc text-7xl font-bold leading-none drop-shadow ${over ? "text-cc-pink" : "text-cc-lime"}`}>{money(m.safeToday)}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cc-aqua">Mountain report · {report}</div>
          <div className="mt-1 text-xs text-cc-snow/80">
            {over ? `Over budget by ${money(-m.remaining)} this month` : `${money(m.remaining)} left this month · ${m.daysLeft} days to go`}
          </div>
        </div>
      </div>

      <BackupNudge state={state} onPlan={onPlan} />
      <Weather />
      <Countdowns state={state} />
      <p className="px-1 text-center font-cc text-xl italic leading-snug text-cc-snow/80">“{quoteOf(todayIso)}”</p>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">
        {rank.cur.mark} {rank.cur.name}
        {rank.next ? ` · ${money(rank.next.at - rank.saved)} to ${rank.next.name}` : ""}
      </div>

      <PaydaySplit state={state} actions={actions} />
      <DueSoon state={state} />

      <DeadlineCards state={state} />
      <FridayPayCard state={state} actions={actions} />
      <WhatIf state={state} />
      <Runway state={state} />
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

      <RunsCard state={state} />

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
