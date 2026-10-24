import { useEffect, useState } from "react";
import { buzz } from "../haptic";
import { daysBetween, iso, parse, today } from "../calc";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, label } from "../ui";

export const MOVES: { name: string; cue: string }[] = [
  { name: "Squats", cue: "Sit back, knees over toes, chest up." },
  { name: "Wall sit", cue: "Back flat on the wall, thighs level." },
  { name: "Lunges", cue: "Alternate legs, front knee stays stacked." },
  { name: "Plank", cue: "Straight line from head to heels." },
  { name: "Single-leg balance", cue: "Soft knee. Switch legs halfway." },
  { name: "Ankle and hip stretch", cue: "Slow circles, then hold a deep squat." },
];
const WORK = 40;
const REST = 15;

/** Consecutive days ending today (or yesterday) with a finished circuit. */
export function prepStreak(days: string[], now = today()): number {
  const set = new Set(days);
  let d = new Date(now);
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(iso(d))) {
    n++;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  }
  return n;
}

/** Where the trip date comes from: the first deadline that sounds like a ski trip, else Dec 10. */
export function tripDate(state: State): { name: string; date: string } {
  const dl = state.plan?.deadlines.find((d) => /ski|snow|board|montana|trip/i.test(d.name));
  return dl ? { name: dl.name, date: dl.date } : { name: "Montana ski trip", date: "2026-12-10" };
}

/** A short daily legs-and-core circuit, plus a countdown. Shows only in the 60 days before the trip so it stays out of the way. */
export function Prep({ state, actions }: { state: State; actions: Actions }) {
  const t = today();
  const trip = tripDate(state);
  const left = daysBetween(t, parse(trip.date));
  const [step, setStep] = useState<number | null>(null);
  const [sec, setSec] = useState(WORK);
  const [resting, setResting] = useState(false);
  const todayIso = iso(t);
  const done = state.prepDays.includes(todayIso);
  const streak = prepStreak(state.prepDays, t);

  useEffect(() => {
    if (step === null) return;
    const id = window.setTimeout(() => {
      if (sec > 1) return setSec(sec - 1);
      buzz(40);
      if (!resting && step < MOVES.length - 1) {
        setResting(true);
        setSec(REST);
      } else if (resting) {
        setResting(false);
        setStep(step + 1);
        setSec(WORK);
      } else {
        actions.prepDone(todayIso);
        setStep(null);
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [step, sec, resting, actions, todayIso]);

  if (left < 0 || left > 60) return null;
  const move = step === null ? null : MOVES[step];
  return (
    <Card tone="aqua" className="space-y-3" photo="/art/gondola.webp">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Heading tone="aqua">Board prep</Heading>
          <div className={label}>
            {left} days to {trip.name}
          </div>
        </div>
        <div className="text-right">
          <div className="font-cc text-4xl font-bold leading-none">{streak}</div>
          <div className={label}>day streak</div>
        </div>
      </div>
      {move ? (
        <div className="space-y-2 text-center" aria-live="polite">
          <div className={label}>
            {resting ? "Rest" : `Move ${(step ?? 0) + 1} of ${MOVES.length}`}
          </div>
          <div className="font-cc text-3xl font-semibold">{resting ? `Next: ${MOVES[(step ?? 0) + 1]?.name}` : move.name}</div>
          <div className="font-cc text-6xl font-bold tabular-nums">{sec}</div>
          {!resting && <p className="text-sm text-cc-muted">{move.cue}</p>}
          <Button variant="ghost" onClick={() => setStep(null)}>
            Stop
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm">
            {done
              ? "Done today. Legs are getting ready."
              : `About ${Math.round(((WORK + REST) * MOVES.length) / 60)} minutes, ${MOVES.length} moves. No gear.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setStep(0);
                setSec(WORK);
                setResting(false);
              }}
            >
              {done ? "Go again" : "Start circuit"}
            </Button>
            {!done && (
              <Button variant="ghost" onClick={() => actions.prepDone(todayIso)}>
                I did my own
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
