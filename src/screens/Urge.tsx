import { useEffect, useRef, useState } from "react";
import { buzz } from "../haptic";
import { keptInPocket } from "../rank";
import { iso, money, today } from "../calc";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, input, label } from "../ui";

const SECONDS = 600;

/** Urge toolkit: a 10-minute pause with breathing, a tally of real bets skipped, and the casino as the outlet. */
export function Urge({ state, actions, onCasino }: { state: State; actions: Actions; onCasino: () => void }) {
  const [left, setLeft] = useState<number | null>(null);
  const [amt, setAmt] = useState("");
  const [open, setOpen] = useState(false);
  const [moveIt, setMoveIt] = useState(false);
  const [bucketId, setBucketId] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) {
      buzz([60, 40, 60]);
      return;
    }
    timer.current = window.setTimeout(() => setLeft((l) => (l === null ? l : l - 1)), 1000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [left]);

  const kept = keptInPocket(state);
  const running = left !== null && left > 0;
  const done = left !== null && left <= 0;
  const mm = left === null ? "10:00" : `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, "0")}`;
  // 4s in, 4s hold, 6s out
  const phase = left === null ? 0 : (SECONDS - left) % 14;
  const breathe = phase < 4 ? "Breathe in" : phase < 8 ? "Hold" : "Breathe out slow";

  return (
    <Card tone="pink" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading tone="pink">Feeling the urge?</Heading>
          <div className="text-xs text-cc-muted">Wait it out. Urges peak and fade. Real money stays put.</div>
        </div>
        <div className="text-right">
          <div className={label}>Kept in pocket</div>
          <div className="font-cc text-3xl font-bold leading-none text-cc-lime">{money(kept)}</div>
        </div>
      </div>

      {left === null && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" onClick={() => { setLeft(SECONDS); buzz(15); }}>
            Start 10-min pause
          </Button>
          <Button variant="lime" onClick={onCasino}>
            Open casino
          </Button>
        </div>
      )}

      {(running || done) && (
        <div className="relative overflow-hidden rounded-xl border border-cc-line bg-cc-night/60 p-4 text-center">
          <video className="hero-video pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" src="/art/hero-night-loop.mp4" poster="/art/hero-night.webp" autoPlay muted loop playsInline aria-hidden="true" />
          <div className="relative font-cc text-6xl font-bold leading-none text-cc-aqua">{mm}</div>
          <div className="relative mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cc-snow/80">
            {running ? breathe : "You made it. The urge has dropped."}
          </div>
          <div className="relative mt-3 flex gap-2">
            <Button className="flex-1" onClick={() => setLeft(null)}>
              {running ? "Stop" : "Close"}
            </Button>
            <Button variant="lime" className="flex-1" onClick={() => { setOpen(true); }}>
              I skipped it
            </Button>
          </div>
        </div>
      )}

      {left === null && (
        <button className="min-h-11 font-mono text-[10px] uppercase tracking-wider text-cc-aqua" onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Log a skipped real bet"}
        </button>
      )}

      {open && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amt);
            if (n > 0) {
              actions.addResist(n, "");
              const target = bucketId || state.buckets[0]?.id;
              if (moveIt && target) actions.contribute(target, n, iso(today()));
              setMoveIt(false);
              buzz([30, 30, 30]);
              setAmt("");
              setOpen(false);
              setLeft(null);
            }
          }}
        >
          <label className="sr-only" htmlFor="skip-amt">
            How much you would have bet
          </label>
          <div className="flex gap-2">
            <input id="skip-amt" className={input} inputMode="decimal" placeholder="How much you would have bet" value={amt} onChange={(e) => setAmt(e.target.value)} />
            <Button variant="lime" type="submit">
              Keep it
            </Button>
          </div>
          {state.buckets.length > 0 && (
            <div className="space-y-2">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={moveIt} onChange={(e) => setMoveIt(e.target.checked)} className="h-5 w-5" />
                I really moved that money into savings
              </label>
              {moveIt && (
                <select className="min-h-11 w-full rounded-lg border border-cc-line bg-cc-night/60 px-3" value={bucketId || state.buckets[0].id} onChange={(e) => setBucketId(e.target.value)} aria-label="Savings bucket for skipped bet">
                  {state.buckets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </form>
      )}
      {state.resisted.length > 0 && (
        <div className="font-mono text-[10px] uppercase tracking-wider text-cc-muted">
          {state.resisted.length} real bet{state.resisted.length === 1 ? "" : "s"} skipped
        </div>
      )}
    </Card>
  );
}
