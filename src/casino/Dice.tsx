import { useEffect, useRef, useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { chance, clampTarget, DICE_BETS, type Dir, MAX_T, MIN_T, multiplier, payout, wins } from "./dice-logic";

/** Powder Dice: pick under or over a number, roll 0 to 99. Smaller odds pay more. */
export function Dice({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [dir, setDir] = useState<Dir>("under");
  const [t, setT] = useState(50);
  const [roll, setRoll] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const ch = chance(dir, t);
  const mult = multiplier(dir, t);
  const go = () => {
    if (busy || bet > chips) return;
    const result = Math.floor(Math.random() * 100);
    const back = payout(result, dir, t, bet);
    // the wallet settles at once; the number is just the reveal
    adjust(back - bet);
    setBusy(true);
    setMsg("");
    play("tick");
    let n = 0;
    timer.current = window.setInterval(() => {
      n++;
      if (n < 7) setRoll(Math.floor(Math.random() * 100));
      else {
        if (timer.current) window.clearInterval(timer.current);
        setRoll(result);
        setBusy(false);
        if (wins(result, dir, t)) {
          play(back >= bet * 5 ? "big" : "win");
          setMsg(`Rolled ${result}. You win ${back} chips (+${back - bet}).`);
        } else {
          play("lose");
          setMsg(`Rolled ${result}. You lose ${bet}.`);
        }
      }
    }, 70);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Powder dice</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="flex h-24 items-center justify-center rounded-2xl border border-cc-line bg-cc-night font-cc text-6xl" role="img" aria-label={roll === null ? "No roll yet" : `Rolled ${roll}`}>
        {roll === null ? "--" : roll}
      </div>
      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {msg}
      </p>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Under or over">
        {(["under", "over"] as const).map((d) => (
          <Button key={d} variant={dir === d ? "primary" : "ghost"} disabled={busy} onClick={() => setDir(d)}>
            Roll {d}
          </Button>
        ))}
      </div>
      <label className="block space-y-1">
        <span className={label}>
          {dir === "under" ? "Under" : "Over"} {t}
        </span>
        <input type="range" min={MIN_T} max={MAX_T} step={1} value={t} disabled={busy} onChange={(e) => setT(clampTarget(Number(e.target.value)))} className="w-full" aria-label="Target number" />
      </label>
      <div className="text-center text-sm text-cc-muted">
        {Math.round(ch * 100)}% to win · pays {mult.toFixed(2)}x
      </div>
      <div className="grid grid-cols-4 gap-2">
        {DICE_BETS.map((b) => (
          <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={busy || b > chips} onClick={() => setBet(b)}>
            {b}
          </Button>
        ))}
      </div>
      <Button className="w-full" disabled={busy || bet > chips} onClick={go}>
        Roll ({bet})
      </Button>
      <p className="text-xs text-cc-muted">The roll is 0 to 99. Lower odds pay more. Play chips only.</p>
    </div>
  );
}
