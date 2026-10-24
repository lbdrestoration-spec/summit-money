import { useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { makeShoe, type Card } from "./cards";
import { CardView } from "./CardView";
import { cashValue, HILO_BETS, odds, stepMult } from "./hilo-logic";

type Round = { bet: number; cur: Card; deck: Card[]; mult: number; streak: number };

/** Higher or lower. Each right guess multiplies the stake; cash out any time. */
export function HiLo({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [round, setRound] = useState<Round | null>(null);
  const [msg, setMsg] = useState("");

  const start = () => {
    if (bet > chips) return;
    adjust(-bet);
    const d = makeShoe(1);
    setRound({ bet, cur: d.pop() as Card, deck: d, mult: 1, streak: 0 });
    setMsg("");
    play("tick");
  };
  const guess = (dir: "higher" | "lower") => {
    if (!round) return;
    const o = odds(round.cur, round.deck);
    const p = dir === "higher" ? o.higher : o.lower;
    if (p === 0) return;
    const d = [...round.deck];
    const next = d.pop() as Card;
    const win = dir === "higher" ? next.r > round.cur.r : next.r < round.cur.r;
    if (win) {
      play("win");
      setRound({ ...round, cur: next, deck: d, mult: round.mult * stepMult(p), streak: round.streak + 1 });
    } else {
      play("lose");
      setRound(null);
      setLast(next);
      setMsg(`The next card ${next.r === round.cur.r ? "tied" : "went the other way"}. You lost ${round.bet}.`);
    }
  };
  const [last, setLast] = useState<Card | null>(null);
  const cash = () => {
    if (!round || round.streak === 0) return;
    const v = cashValue(round.bet, round.mult);
    adjust(v);
    play(v >= round.bet * 5 ? "big" : "win");
    setMsg(`Cashed out ${v} chips after ${round.streak} right.`);
    setLast(null);
    setRound(null);
  };

  const o = round ? odds(round.cur, round.deck) : null;
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Higher or lower</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="flex justify-center gap-3">
        {round ? <CardView card={round.cur} /> : last ? <CardView card={last} /> : <CardView card={null} />}
      </div>
      {round ? (
        <>
          <div className="text-center text-sm" aria-live="polite">
            {round.streak} right · now worth <span className="font-cc text-lg text-cc-gold">{cashValue(round.bet, round.mult)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="lime" disabled={!o || o.higher === 0} onClick={() => guess("higher")}>
              Higher {o && o.higher > 0 ? `${Math.round(o.higher * 100)}%` : ""}
            </Button>
            <Button variant="danger" disabled={!o || o.lower === 0} onClick={() => guess("lower")}>
              Lower {o && o.lower > 0 ? `${Math.round(o.lower * 100)}%` : ""}
            </Button>
          </div>
          <Button className="w-full" disabled={round.streak === 0} onClick={cash}>
            Cash out {round.streak > 0 ? cashValue(round.bet, round.mult) : ""}
          </Button>
        </>
      ) : (
        <>
          {msg && (
            <p className="text-center text-sm" aria-live="polite">
              {msg}
            </p>
          )}
          <div className="grid grid-cols-4 gap-2">
            {HILO_BETS.map((b) => (
              <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={b > chips} onClick={() => setBet(b)}>
                {b}
              </Button>
            ))}
          </div>
          <Button className="w-full" disabled={bet > chips} onClick={start}>
            Deal ({bet})
          </Button>
          <p className="text-xs text-cc-muted">A tie loses. Odds come from the cards left in the deck. Each right guess multiplies your stake, cash out any time.</p>
        </>
      )}
    </div>
  );
}
