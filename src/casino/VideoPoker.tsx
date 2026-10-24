import { useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { makeShoe, type Card } from "./cards";
import { CardView } from "./CardView";
import { BETS, drawCards, PAYS, rate } from "./vp-logic";

type Phase = "bet" | "hold" | "done";

/** Jacks or Better video poker. Deal costs your bet, the draw pays by the table. */
export function VideoPoker({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<Phase>("bet");
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [paid, setPaid] = useState<{ name: string; won: number } | null>(null);

  const deal = () => {
    if (bet > chips) return;
    adjust(-bet);
    const d = makeShoe(1);
    const h = [0, 1, 2, 3, 4].map(() => d.pop() as Card);
    setDeck(d);
    setHand(h);
    setHeld([false, false, false, false, false]);
    setPaid(null);
    setPhase("hold");
    play("tick");
  };
  const draw = () => {
    const r = drawCards(hand, held, deck);
    setHand(r.hand);
    setDeck(r.deck);
    const res = rate(r.hand);
    const won = res ? res.mult * bet : 0;
    if (won > 0) {
      adjust(won);
      play(res && res.mult >= 25 ? "big" : "win");
    }
    setPaid({ name: res?.name ?? "No win", won });
    setPhase("done");
  };
  const current = phase === "bet" ? null : rate(hand);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Video poker, Jacks or Better</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="flex justify-center gap-1.5">
        {phase === "bet"
          ? [0, 1, 2, 3, 4].map((i) => <CardView key={i} card={null} />)
          : hand.map((c, i) => (
              <button
                key={i}
                disabled={phase !== "hold"}
                aria-pressed={held[i]}
                aria-label={`Hold card ${i + 1}`}
                onClick={() => setHeld(held.map((x, j) => (j === i ? !x : x)))}
                className="relative flex flex-col items-center gap-1"
              >
                <CardView card={c} />
                <span className={`font-mono text-[10px] uppercase ${held[i] ? "text-cc-lime" : "text-transparent"}`}>Held</span>
              </button>
            ))}
      </div>
      <div className="min-h-6 text-center text-sm" aria-live="polite">
        {phase === "hold" && (current ? `You have ${current.name}. Tap cards to hold.` : "Tap the cards you want to keep.")}
        {phase === "done" && paid && (paid.won > 0 ? `${paid.name}! +${paid.won} chips` : "No win. Try another hand.")}
      </div>
      {phase === "hold" ? (
        <Button variant="lime" className="w-full" onClick={draw}>
          Draw
        </Button>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {BETS.map((b) => (
              <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={b > chips} onClick={() => setBet(b)}>
                {b}
              </Button>
            ))}
          </div>
          <Button className="w-full" disabled={bet > chips} onClick={deal}>
            {phase === "done" ? `Deal again (${bet})` : `Deal (${bet})`}
          </Button>
        </>
      )}
      <details className="text-xs text-cc-muted">
        <summary className="min-h-11 cursor-pointer py-3">Pay table</summary>
        <ul className="space-y-0.5">
          {PAYS.map((p) => (
            <li key={p.name} className="flex justify-between">
              <span>{p.name}</span>
              <span>{p.mult}x</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
