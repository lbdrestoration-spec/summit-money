import { useEffect, useRef, useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { PAIR_PAY, payout, pick, SLOT_BETS, SYMBOLS, spin } from "./slots-logic";

/** Snow Slots: three reels, three in a row pays, a pair on the first two gives your stake back. */
export function Slots({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<[number, number, number]>([0, 1, 2]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const go = () => {
    if (busy || bet > chips) return;
    const result = spin(Math.random);
    const win = payout(result, bet);
    // the wallet settles right away; the reels are just the reveal
    adjust(win - bet);
    setBusy(true);
    setMsg("");
    play("tick");
    let n = 0;
    timer.current = window.setInterval(() => {
      n++;
      if (n < 8) setReels([pick(Math.random()), pick(Math.random()), pick(Math.random())]);
      else {
        if (timer.current) window.clearInterval(timer.current);
        setReels(result);
        setBusy(false);
        if (win > bet) {
          play(win >= bet * 18 ? "big" : "win");
          setMsg(`Three in a row! +${win - bet} chips.`);
        } else if (win === bet) setMsg("A pair. Stake back.");
        else {
          play("lose");
          setMsg(`No match. -${bet}.`);
        }
      }
    }, 80);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Snow Slots</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="flex justify-center gap-3" role="img" aria-label={`Reels: ${reels.map((r) => SYMBOLS[r].name).join(", ")}`}>
        {reels.map((r, i) => (
          <div key={i} className="flex h-24 w-24 items-center justify-center rounded-2xl border border-cc-line bg-cc-night text-5xl">
            {SYMBOLS[r].s}
          </div>
        ))}
      </div>
      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {msg}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {SLOT_BETS.map((b) => (
          <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={busy || b > chips} onClick={() => setBet(b)}>
            {b}
          </Button>
        ))}
      </div>
      <Button className="w-full" disabled={busy || bet > chips} onClick={go}>
        Spin ({bet})
      </Button>
      <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] text-cc-muted">
        {SYMBOLS.map((x) => (
          <div key={x.name}>
            {x.s}×3 pays {x.pay}x
          </div>
        ))}
      </div>
      <p className="text-xs text-cc-muted">Two matching on the first two reels gives your stake back ({PAIR_PAY}x). Play chips only, never real money.</p>
    </div>
  );
}
