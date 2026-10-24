import { daysBetween, fridaysBetween, iso, today, paychecksBetween, addDays } from "../calc";
import { isLogged } from "../chips";
import type { State } from "../types";

/** A one-line glance at what is left today, plus days to the next paycheck. */
export function TodayStrip({ state, onCasino }: { state: State; onCasino: () => void }) {
  const t = today();
  const d = iso(t);
  const items = [
    { k: "log", label: "Logged", done: isLogged(state, d), go: undefined as undefined | (() => void) },
    { k: "prep", label: "Prep", done: state.prepDays.includes(d), go: undefined },
    { k: "wheel", label: "Wheel", done: state.daily.wheel === d, go: onCasino },
    { k: "trivia", label: "Trivia", done: state.trivia.day === d && state.trivia.done >= 3, go: onCasino },
  ];
  const left = items.filter((i) => !i.done).length;
  const dates = [
    ...(state.settings ? paychecksBetween(state.settings, t, addDays(t, 30)) : []),
    ...(state.plan ? fridaysBetween(state.plan, t, addDays(t, 30)) : []),
  ].map((p) => p.date).sort();
  const days = dates.length ? daysBetween(t, new Date(`${dates[0]}T12:00:00`)) : null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cc-line bg-cc-panel/70 px-3 py-2 backdrop-blur" role="group" aria-label="Today at a glance">
      <span className="font-mono text-[10px] uppercase tracking-wider text-cc-muted">{left === 0 ? "All done today" : `${left} left today`}</span>
      {items.map((i) => {
        const cls = `min-h-11 rounded-full border px-3 font-mono text-[10px] uppercase tracking-wider ${i.done ? "border-cc-lime/60 text-cc-lime" : "border-cc-line text-cc-muted"}`;
        return i.go && !i.done ? (
          <button key={i.k} className={cls} onClick={i.go}>
            ○ {i.label}
          </button>
        ) : (
          <span key={i.k} className={`${cls} inline-flex items-center`}>
            {i.done ? "✓" : "○"} {i.label}
          </span>
        );
      })}
      {days !== null && (
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-cc-aqua">{days === 0 ? "Payday today" : `Payday in ${days}d`}</span>
      )}
    </div>
  );
}
