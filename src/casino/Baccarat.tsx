import { useRef, useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { BACC_BETS, dealRound, payout, type Round, type Side } from "./baccarat-logic";
import { makeShoe, type Card } from "./cards";
import { CardView } from "./CardView";

const SIDES: { id: Side; name: string; pays: string }[] = [
  { id: "player", name: "Player", pays: "pays 1 to 1" },
  { id: "banker", name: "Banker", pays: "pays 0.95 to 1" },
  { id: "tie", name: "Tie", pays: "pays 8 to 1" },
];

/** Baccarat: bet on the player hand, the banker hand, or a tie. No decisions after you bet. */
export function Baccarat({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const shoe = useRef<Card[]>([]);
  const [bet, setBet] = useState(20);
  const [side, setSide] = useState<Side>("banker");
  const [round, setRound] = useState<Round | null>(null);
  const [msg, setMsg] = useState("");

  const deal = () => {
    if (bet > chips) return;
    if (shoe.current.length < 20) shoe.current = makeShoe(8);
    const r = dealRound(shoe.current);
    const back = payout(side, r.winner, bet);
    adjust(back - bet);
    setRound(r);
    if (back > bet) {
      play(back >= bet * 5 ? "big" : "win");
      setMsg(`${r.winner === "tie" ? "Tie" : r.winner === "player" ? "Player" : "Banker"} wins ${r.pt} to ${r.bt}. You win ${back - bet}.`);
    } else if (back === bet) setMsg(`Tie at ${r.pt}. Your ${side} bet is returned.`);
    else {
      play("lose");
      setMsg(`${r.winner === "player" ? "Player" : "Banker"} wins ${r.pt} to ${r.bt}. You lose ${bet}.`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Baccarat</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      {round && (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["Player", round.player, round.pt],
              ["Banker", round.banker, round.bt],
            ] as const
          ).map(([name, cards, t]) => (
            <div key={name} className="space-y-1" role="group" aria-label={`${name} hand`}>
              <div className={label}>
                {name} · {t}
              </div>
              <div className="flex gap-1.5">
                {cards.map((c, i) => (
                  <CardView key={i} card={c} small />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="min-h-6 text-center text-sm" aria-live="polite">
        {msg}
      </p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Bet on">
        {SIDES.map((s) => (
          <Button key={s.id} variant={side === s.id ? "primary" : "ghost"} onClick={() => setSide(s.id)}>
            {s.name}
          </Button>
        ))}
      </div>
      <div className="text-center text-xs text-cc-muted">{SIDES.find((s) => s.id === side)?.pays}{side === "banker" ? " (5% commission)" : ""}</div>
      <div className="grid grid-cols-4 gap-2">
        {BACC_BETS.map((b) => (
          <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={b > chips} onClick={() => setBet(b)}>
            {b}
          </Button>
        ))}
      </div>
      <Button className="w-full" disabled={bet > chips} onClick={deal}>
        Deal ({bet})
      </Button>
      <p className="text-xs text-cc-muted">Closest to 9 wins. Tens and face cards count 0. Third cards are dealt by the standard rules.</p>
    </div>
  );
}
