import { useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { BOARD, draw, hits, KENO_BETS, MAX_PICKS, PAYS, payout } from "./keno-logic";

/** Keno: pick up to five numbers on a board of 40, ten are drawn. More matches pay more. */
export function Keno({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [picks, setPicks] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<Set<number> | null>(null);
  const [msg, setMsg] = useState("");

  const toggle = (n: number) => {
    setDrawn(null);
    setMsg("");
    setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length < MAX_PICKS ? [...p, n] : p));
  };
  const go = () => {
    if (picks.length === 0 || bet > chips) return;
    const d = draw(Math.random);
    const back = payout(picks, d, bet);
    adjust(back - bet);
    setDrawn(d);
    const k = hits(picks, d);
    if (back > bet) {
      play(back >= bet * 10 ? "big" : "win");
      setMsg(`${k} hit${k === 1 ? "" : "s"}! You win ${back} (+${back - bet}).`);
    } else if (back === bet) setMsg(`${k} hits. Stake back.`);
    else {
      play("lose");
      setMsg(`${k} hit${k === 1 ? "" : "s"}. You lose ${bet - back}.`);
    }
  };
  const table = PAYS[picks.length];
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Keno</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="grid grid-cols-8 gap-1" role="group" aria-label="Keno board">
        {Array.from({ length: BOARD }, (_, i) => i + 1).map((n) => {
          const picked = picks.includes(n);
          const hit = drawn?.has(n);
          return (
            <button
              key={n}
              onClick={() => toggle(n)}
              aria-pressed={picked}
              aria-label={`Number ${n}${picked ? ", picked" : ""}${hit ? (picked ? ", hit" : ", drawn") : ""}`}
              className={`flex h-10 items-center justify-center rounded-lg border font-mono text-xs ${picked && hit ? "border-cc-lime bg-cc-lime/30 text-cc-lime" : picked ? "border-cc-gold bg-cc-gold/20 text-cc-gold" : hit ? "border-cc-aqua bg-cc-aqua/20 text-cc-aqua" : "border-cc-line text-cc-muted"}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {msg || (picks.length === 0 ? `Pick 1 to ${MAX_PICKS} numbers.` : `${picks.length} picked.`)}
      </p>
      {table && (
        <div className="text-center text-xs text-cc-muted">
          {Object.entries(table)
            .map(([k, m]) => `${k} hit${k === "1" ? "" : "s"} pays ${m}x`)
            .join(" · ")}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {KENO_BETS.map((b) => (
          <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={b > chips} onClick={() => setBet(b)}>
            {b}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setPicks([]);
            setDrawn(null);
            setMsg("");
          }}
        >
          Clear
        </Button>
        <Button disabled={picks.length === 0 || bet > chips} onClick={go}>
          Draw ({bet})
        </Button>
      </div>
      <p className="text-xs text-cc-muted">Ten of the 40 numbers are drawn each time. Gold is your pick, aqua is drawn, green is a hit.</p>
    </div>
  );
}
