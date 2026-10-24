import { useEffect, useRef, useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { payout, SEGMENTS, spin, WHEEL_BETS } from "./spin-logic";

/** Summit Wheel: a marker races around 24 slots and slows to a stop. */
export function SummitWheel({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const go = () => {
    if (busy || bet > chips) return;
    const seg = spin();
    const back = payout(bet, seg);
    // the wallet settles at once; the marker is just the reveal
    adjust(back - bet);
    setBusy(true);
    setMsg("");
    const start = pos ?? 0;
    const steps = SEGMENTS.length * 2 + ((seg - start + SEGMENTS.length) % SEGMENTS.length);
    let i = 0;
    const tick = () => {
      i++;
      setPos((start + i) % SEGMENTS.length);
      play("tick");
      if (i < steps) timer.current = window.setTimeout(tick, 40 + Math.pow(i / steps, 3) * 260);
      else {
        setBusy(false);
        if (back > bet) {
          play(back >= bet * 5 ? "big" : "win");
          setMsg(`${SEGMENTS[seg]}x. You win ${back} chips (+${back - bet}).`);
        } else if (back === bet) setMsg("1x. Chips back.");
        else if (back > 0) setMsg(`${SEGMENTS[seg]}x. You get ${back} back (${back - bet}).`);
        else {
          play("lose");
          setMsg(`Empty slot. You lose ${bet}.`);
        }
      }
    };
    timer.current = window.setTimeout(tick, 60);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Summit wheel</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="grid grid-cols-6 gap-1 rounded-2xl border border-cc-line bg-cc-night p-2" role="img" aria-label={pos === null ? "Wheel at rest" : `Marker on ${SEGMENTS[pos]}x`}>
        {SEGMENTS.map((m, i) => (
          <div key={i} className={`rounded py-2 text-center font-mono text-[11px] ${pos === i ? "bg-cc-gold text-cc-night" : m === 0 ? "bg-cc-line/40 text-cc-muted" : m >= 1 ? "bg-cc-lime/20 text-cc-lime" : "bg-cc-pink/15 text-cc-pink"}`}>
            {m === 0 ? "·" : `${m}x`}
          </div>
        ))}
      </div>
      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {msg}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {WHEEL_BETS.map((b) => (
          <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={busy || b > chips} onClick={() => setBet(b)}>
            {b}
          </Button>
        ))}
      </div>
      <Button className="w-full" disabled={busy || bet > chips} onClick={go}>
        Spin ({bet})
      </Button>
      <p className="text-xs text-cc-muted">24 slots, 12 of them empty, one pays 8x. Over time it pays back less than you put in. Play chips only.</p>
    </div>
  );
}
