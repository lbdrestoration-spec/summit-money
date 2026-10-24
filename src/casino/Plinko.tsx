import { useEffect, useRef, useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { bucketOf, drop, multipliers, payout, PLINKO_BETS, RISKS, ROWS, type Risk } from "./plinko-logic";

/** Powder Drop: a ball bounces down ten rows of pegs into a payout slot. */
export function Plinko({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState<Risk>("mid");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1);
  const [path, setPath] = useState<number[]>([]);
  const [landed, setLanded] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const mults = multipliers(risk);
  const go = () => {
    if (busy || bet > chips) return;
    const p = drop();
    const b = bucketOf(p);
    const back = payout(bet, risk, b);
    // the wallet settles at once; the fall is just the reveal
    adjust(back - bet);
    setBusy(true);
    setPath(p);
    setLanded(null);
    setMsg("");
    setStep(0);
    play("tick");
    let n = 0;
    timer.current = window.setInterval(() => {
      n++;
      if (n <= ROWS) {
        setStep(n);
        play("tick");
      } else {
        if (timer.current) window.clearInterval(timer.current);
        setLanded(b);
        setBusy(false);
        if (back > bet) {
          play(back >= bet * 5 ? "big" : "win");
          setMsg(`Slot ${mults[b]}x. You win ${back} chips (+${back - bet}).`);
        } else {
          play("lose");
          setMsg(back === bet ? `Slot ${mults[b]}x. Chips back.` : `Slot ${mults[b]}x. You get ${back} back (${back - bet}).`);
        }
      }
    }, 110);
  };

  // ball column after `step` rows: number of rights so far
  const col = path.slice(0, Math.max(step, 0)).reduce((a, b) => a + b, 0);
  const pegs = Array.from({ length: ROWS }, (_, r) => r + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Powder drop</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="rounded-2xl border border-cc-line bg-cc-night p-2" role="img" aria-label={landed === null ? "Peg board" : `Ball landed in the ${mults[landed]}x slot`}>
        <div className="space-y-1">
          {pegs.map((n, r) => (
            <div key={r} className="flex justify-center gap-3">
              {Array.from({ length: n }, (_, i) => {
                const here = busy && step === r + 1 && i === col;
                return <span key={i} className={`h-2.5 w-2.5 rounded-full ${here ? "bg-cc-gold" : "bg-cc-muted/40"}`} />;
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-11 gap-0.5">
          {mults.map((m, i) => (
            <div key={i} className={`rounded py-1 text-center font-mono text-[9px] ${landed === i ? "bg-cc-gold text-cc-night" : m >= 1 ? "bg-cc-lime/20 text-cc-lime" : "bg-cc-pink/15 text-cc-pink"}`}>
              {m}x
            </div>
          ))}
        </div>
      </div>
      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {msg}
      </p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Risk">
        {RISKS.map((r) => (
          <Button key={r} variant={risk === r ? "primary" : "ghost"} disabled={busy} onClick={() => setRisk(r)}>
            {r === "mid" ? "Medium" : r === "low" ? "Low" : "High"}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PLINKO_BETS.map((b) => (
          <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={busy || b > chips} onClick={() => setBet(b)}>
            {b}
          </Button>
        ))}
      </div>
      <Button className="w-full" disabled={busy || bet > chips} onClick={go}>
        Drop ({bet})
      </Button>
      <p className="text-xs text-cc-muted">Higher risk means bigger edge slots and smaller middle slots. Every setting pays back less than you put in over time. Play chips only.</p>
    </div>
  );
}
