import { useRef, useState } from "react";
import { Button, label } from "../ui";
import { makeShoe, type Card } from "./cards";
import { CardView } from "./CardView";
import { dealerPlay, isBlackjack, settle, value } from "./blackjack-logic";

const CHIPS = [10, 50, 100, 500];
type Phase = "bet" | "player" | "done";

export function Blackjack({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const shoe = useRef<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState(0);
  const [stake, setStake] = useState(0);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [msg, setMsg] = useState("");
  const [net, setNet] = useState(0);

  const draw = () => {
    if (shoe.current.length < 20) shoe.current = makeShoe(6);
    return shoe.current.pop() as Card;
  };

  function resolve(p: Card[], d: Card[], st: number) {
    const { back, msg } = settle(p, d, st);
    if (back > 0) adjust(back);
    setNet(back - st);
    setMsg(msg);
    setDealer(d);
    setPlayer(p);
    setPhase("done");
  }

  function deal() {
    if (bet <= 0 || bet > chips) return;
    adjust(-bet);
    setStake(bet);
    const p = [draw(), draw()];
    const d = [draw(), draw()];
    setMsg("");
    if (isBlackjack(p) || isBlackjack(d)) return resolve(p, d, bet);
    setPlayer(p);
    setDealer(d);
    setPhase("player");
  }

  function hit() {
    const p = [...player, draw()];
    if (value(p).total >= 21) {
      // 21 stands automatically, over 21 busts
      const d = value(p).total > 21 ? dealer : dealerPlay(shoe.current, dealer);
      return resolve(p, d, stake);
    }
    setPlayer(p);
  }

  function stand() {
    resolve(player, dealerPlay(shoe.current, dealer), stake);
  }

  function double() {
    if (chips < stake || player.length !== 2) return;
    adjust(-stake);
    const st = stake * 2;
    setStake(st);
    const p = [...player, draw()];
    resolve(p, value(p).total > 21 ? dealer : dealerPlay(shoe.current, dealer), st);
  }

  const hideHole = phase === "player";
  const dv = value(hideHole ? dealer.slice(0, 1) : dealer).total;
  const pv = value(player).total;

  return (
    <div className="space-y-4">
      {phase !== "bet" && (
        <>
          <div>
            <div className={label}>Dealer {dealer.length > 0 && `· ${dv}`}</div>
            <div className="mt-1 flex gap-2">
              {dealer.map((c, i) => (
                <CardView key={i} card={hideHole && i === 1 ? null : c} />
              ))}
            </div>
          </div>
          <div>
            <div className={label}>You · {pv}</div>
            <div className="mt-1 flex gap-2">
              {player.map((c, i) => (
                <CardView key={i} card={c} />
              ))}
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">On the table: {stake} chips</div>
        </>
      )}

      {phase === "done" && (
        <div className={`rounded-lg border p-3 text-center ${net > 0 ? "border-cc-lime/50 text-cc-lime" : net < 0 ? "border-cc-pink/50 text-cc-pink" : "border-cc-line text-cc-snow"}`}>
          <div className="font-cc text-2xl uppercase">{msg}</div>
          <div className="text-sm">{net > 0 ? `+${net} chips` : net < 0 ? `${net} chips` : "Chips back"}</div>
        </div>
      )}

      {phase === "player" && (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="lime" onClick={hit}>
            Hit
          </Button>
          <Button variant="primary" onClick={stand}>
            Stand
          </Button>
          <Button disabled={chips < stake || player.length !== 2} onClick={double}>
            Double
          </Button>
        </div>
      )}

      {phase !== "player" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={label}>Your bet</span>
            <span className="font-cc text-3xl text-cc-gold">{bet}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CHIPS.map((c) => (
              <Button key={c} disabled={bet + c > chips} onClick={() => setBet(bet + c)}>
                +{c}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setBet(0)} disabled={bet === 0}>
              Clear
            </Button>
            <Button variant="lime" onClick={deal} disabled={bet <= 0 || bet > chips}>
              Deal
            </Button>
          </div>
          {bet > chips && <p className="text-xs text-cc-pink">That bet is more than your chips. Tap Clear and bet less.</p>}
          <p className="text-xs text-cc-muted">Blackjack pays 3 to 2. Dealer stands on all 17s. No splitting or insurance.</p>
        </div>
      )}
    </div>
  );
}
