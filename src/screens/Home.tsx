import { useState } from "react";
import { bucketSaved, money, monthStats, parse, savingsSeries, streak, today, iso } from "../calc";
import { StockChart } from "../Chart";
import type { Actions } from "../store";
import type { State } from "../types";
import { rankOf, savingWeekStreak } from "../rank";
import { projectTo } from "../plan";
import { Button, Card, Empty, Heading, label, Stat } from "../ui";
import { makeShareCard, shareProgress } from "../shareCard";
import { Countdowns, DueSoon, BillsCover, BiggestLeak, WeekRing, Challenge, SaveHeat, YearEnd, WeekNudge, LastWeek, RoundUpJar, Milestones, MonthlyBars, PayFirst, PaydaySplit, SavingsRate, Runway, SavingsSplit, Timeline, WhatIf } from "./Insights";
import { RunsCard } from "./Trail";
import { Urge } from "./Urge";
import { Mountain } from "./Mountain";
import { Interest } from "./Interest";
import { TodayStrip } from "./TodayStrip";
import { Local } from "./Local";
import { Prep } from "./Prep";
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

export const HOME_SECTIONS: { id: string; label: string }[] = [
  { id: "weeknudge", label: "Weekly nudge" },
  { id: "countdowns", label: "Countdowns" },
  { id: "paysplit", label: "Payday split" },
  { id: "duesoon", label: "Due soon" },
  { id: "payfirst", label: "Pay yourself first" },
  { id: "lastweek", label: "Last week" },
  { id: "rate", label: "Savings rate" },
  { id: "milestones", label: "Milestones" },
  { id: "yearend", label: "Year-end" },
  { id: "leak", label: "Biggest leak" },
  { id: "roundup", label: "Round-up jar" },
  { id: "billscover", label: "Bills cover" },
  { id: "interest", label: "Interest estimate" },
  { id: "challenge", label: "52-week challenge" },
  { id: "split", label: "Savings split" },
  { id: "monthly", label: "Monthly bars" },
  { id: "heat", label: "Saving heat map" },
  { id: "whatif", label: "What if" },
  { id: "runway", label: "Runway" },
  { id: "timeline", label: "Timeline" },
  { id: "runs", label: "Daily runs" },
  { id: "urge", label: "Urge toolkit" },
  { id: "prep", label: "Board prep" },
  { id: "mountain", label: "Whitefish Mountain" },
  { id: "local", label: "Whitefish list" },
  { id: "weather", label: "Whitefish weather" },
];

const JUMPS = [
  { id: "h-goals", label: "Deadlines" },
  { id: "h-saving", label: "Saving" },
  { id: "h-pay", label: "Pay plan" },
  { id: "h-tools", label: "Tools" },
];

/** The hero photo follows the clock: dawn, day, golden hour, night. */
function skyFor(hour: number): { id: string; src: string; alt: string; video?: string } {
  if (hour >= 5 && hour < 9) return { id: "dawn", video: "/art/hero-dawn-loop.mp4", src: "/art/hero-dawn.webp", alt: "Dawn alpenglow over snowy pines near Whitefish, Montana" };
  if (hour >= 9 && hour < 15) return { id: "day", video: "/art/hero-loop.mp4", src: "/art/hero.webp", alt: "Snow-covered pine forest below a pink alpenglow mountain near Whitefish, Montana" };
  if (hour >= 15 && hour < 20) return { id: "gold", video: "/art/hero-gold-loop.mp4", src: "/art/hero-gold.webp", alt: "Golden hour light through snowy pines near Whitefish, Montana" };
  return { id: "night", video: "/art/hero-night-loop.mp4", src: "/art/hero-night.webp", alt: "Starry night over snowy pines near Whitefish, Montana" };
}

export function Home({ state, actions, onCasino, onPlan }: { state: State; actions: Actions; onCasino: () => void; onPlan: () => void }) {
  const on = (id: string) => !state.hidden.includes(id);
  const sky = skyFor(new Date().getHours());
  const [shareNote, setShareNote] = useState("");
  const m = monthStats(state);
  const series = savingsSeries(state);
  const totalSaved = state.buckets.reduce((a, b) => a + bucketSaved(b), 0);
  const days = streak(state);
  const todayIso = iso(today());
  const checkedToday = state.checkins.includes(todayIso) || state.spends.some((s) => s.date === todayIso);
  const nextPay = m.checks.find((c) => c.date >= todayIso);
  const over = m.remaining < 0;
  const rank = rankOf(state);
  const savingWeeks = savingWeekStreak(state);
  // Nearest upcoming deadline and where you are headed for it
  const nextDeadline = (state.plan?.deadlines ?? [])
    .map((d) => ({ d, p: projectTo(state, d) }))
    .filter((x) => x.p)
    .sort((a, b) => a.d.date.localeCompare(b.d.date))[0];
  const behind = (state.plan?.deadlines ?? []).some((d) => {
    const p = projectTo(state, d);
    return p && p.goalGap !== null && p.goalGap < 0;
  });
  const report = behind ? "Thin cover, keep stacking" : days >= 3 ? "Fresh powder" : "Groomed corduroy";

  return (
    <div className="space-y-4">
      <div className="rise relative min-h-[340px] overflow-hidden rounded-2xl border border-cc-line">
        <img src={sky.src} alt={sky.alt} className="absolute inset-0 h-full w-full object-cover" />
        {sky.video && <video key={sky.video} className="hero-video absolute inset-0 h-full w-full object-cover" src={sky.video} poster={sky.src} autoPlay muted loop playsInline preload="auto" aria-hidden="true" />}
        <div className="absolute inset-0 bg-gradient-to-t from-cc-night via-cc-night/55 to-transparent" />
        <button
          className="absolute right-3 top-3 z-[1] min-h-11 rounded-full border border-cc-line bg-cc-night/60 px-4 font-mono text-[10px] uppercase tracking-wider text-cc-snow backdrop-blur"
          aria-label="Share my progress picture"
          onClick={async () => {
            try {
              const blob = await makeShareCard({ photo: sky.src, saved: totalSaved, rank: rank.cur.name, line: savingWeeks > 0 ? `${savingWeeks} wk saving streak` : "Stacking it up" });
              const r = await shareProgress(blob, `summit-money-${iso(today())}.png`);
              setShareNote(r === "shared" ? "" : "Picture saved");
            } catch (e) {
              if ((e as Error).name !== "AbortError") setShareNote("Couldn't make the picture");
            }
          }}
        >
          Share
        </button>
        <div className="absolute left-3 top-3 z-[1]">
          <WeekRing state={state} />
        </div>
        {shareNote && <div role="status" className="absolute left-1/2 top-16 z-[1] -translate-x-1/2 rounded-full bg-cc-night/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-cc-aqua">{shareNote}</div>}
        <div className="relative flex min-h-[340px] flex-col justify-end p-4">
          <div className={label}>Saved so far</div>
          <div className="font-cc text-7xl font-bold leading-none text-cc-lime drop-shadow">{money(totalSaved)}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cc-aqua">Mountain report · {report}</div>
          <div className="mt-1 text-xs text-cc-snow/80">
            {nextDeadline && nextDeadline.p
              ? `${money(nextDeadline.p.projected)} projected by ${parse(nextDeadline.d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${nextDeadline.p.days} days to go`
              : "Put money in a bucket and watch the line climb"}
          </div>
        </div>
      </div>

      <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Jump to a section">
        {JUMPS.map((j) => (
          <button
            key={j.id}
            onClick={() => document.getElementById(j.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="min-h-11 shrink-0 rounded-full border border-cc-line bg-cc-panel/70 px-4 font-mono text-[11px] uppercase tracking-wider text-cc-aqua backdrop-blur"
          >
            {j.label}
          </button>
        ))}
      </nav>

      <TodayStrip state={state} onCasino={onCasino} />

      {on("weeknudge") && <WeekNudge state={state} actions={actions} />}

      {on("countdowns") && <Countdowns state={state} />}

      <p className="px-1 text-center font-cc text-xl italic leading-snug text-cc-snow/80">“{quoteOf(todayIso)}”</p>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">
        {rank.cur.mark} {rank.cur.name}
        {rank.next ? ` · ${money(rank.next.at - rank.saved)} to ${rank.next.name}` : ""}
      </div>

      {on("paysplit") && <PaydaySplit state={state} actions={actions} />}

      {on("duesoon") && <DueSoon state={state} />}

      <div id="h-goals" className="scroll-mt-4" />
      <DeadlineCards state={state} />

      <div className="grid grid-cols-2 gap-3">
        <Card tone="lime" className="col-span-2">
          <Stat title="Saving streak" value={`${savingWeeks} wk${savingWeeks === 1 ? "" : "s"}`} tone="lime" hint={savingWeeks > 0 ? "Weeks in a row you saved" : "Save this week to start"} />
        </Card>
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

      <div id="h-saving" className="scroll-mt-4" />
      {on("payfirst") && <PayFirst state={state} actions={actions} />}
      {on("lastweek") && <LastWeek state={state} />}
      {on("rate") && <SavingsRate state={state} />}
      {on("milestones") && <Milestones state={state} />}
      {on("yearend") && <YearEnd state={state} />}
      {on("leak") && <BiggestLeak state={state} />}
      {on("roundup") && <RoundUpJar state={state} actions={actions} />}
      {on("billscover") && <BillsCover state={state} />}
      {on("interest") && <Interest state={state} actions={actions} />}
      {on("challenge") && <Challenge state={state} actions={actions} />}
      {on("split") && <SavingsSplit state={state} />}
      {on("monthly") && <MonthlyBars state={state} />}
      {on("heat") && <SaveHeat state={state} />}

      <Card tone="lime">
        <div className="mb-2 flex items-end justify-between">
          <Heading tone="lime">Saved this year</Heading>
          <div className="font-cc text-3xl font-semibold text-cc-lime">{money(totalSaved)}</div>
        </div>
        {totalSaved > 0 ? <StockChart series={series} /> : <Empty>Add your first savings bucket on the Plan tab, then put money in it. Your line starts here.</Empty>}
      </Card>

      <div id="h-pay" className="scroll-mt-4" />
      <FridayPayCard state={state} actions={actions} />

      {on("whatif") && <WhatIf state={state} />}

      {on("runway") && <Runway state={state} />}

      {on("timeline") && <Timeline state={state} />}

      <div id="h-tools" className="scroll-mt-4" />
      {on("runs") && <RunsCard state={state} />}

      {on("urge") && <Urge state={state} actions={actions} onCasino={onCasino} />}

      {on("prep") && <Prep state={state} actions={actions} />}
      {on("mountain") && <Mountain />}
      {on("local") && <Local state={state} actions={actions} />}
      {on("weather") && <Weather />}

      <BackupNudge state={state} onPlan={onPlan} />

      <Customize state={state} actions={actions} />

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

/** Switch Home cards on and off so the screen only shows what you care about. */
function Customize({ state, actions }: { state: State; actions: Actions }) {
  const [open, setOpen] = useState(false);
  return (
    <Card tone="violet">
      <button className="flex min-h-11 w-full items-center justify-between text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Heading tone="violet">Customize Home</Heading>
        <span aria-hidden="true" className="text-xl text-cc-muted">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <ul className="mt-2 grid grid-cols-1 gap-0.5">
          {HOME_SECTIONS.map((x) => (
            <li key={x.id}>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" checked={!state.hidden.includes(x.id)} onChange={() => actions.toggleHidden(x.id)} className="h-5 w-5 accent-cc-violet" />
                {x.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
