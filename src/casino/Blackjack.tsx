import { useRef, useState } from "react";
import { Button, label } from "../ui";
import { makeShoe, type Card } from "./cards";
import { CardView } from "./CardView";
import { canSplitPair, dealerPlay, isBlackjack, settle, value } from "./blackjack-logic";

const CHIPS = [10, 50, 100, 500];
type Phase = "bet" | "player" | "done";

export function Blackjack({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const shoe = useRef<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("bet");
  const [bet, setBet] = useState(0);
  const [hands, setHands] = useState<Card[][]>([]);
  const [stakes, setStakes] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [split, setSplit] = useState(false);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [msg, setMsg] = useState("");
  const [net, setNet] = useState(0);

  const draw = () => {
    if (shoe.current.length < 20) shoe.current = makeShoe(6);
    return shoe.current.pop() as Card;
  };

  /** Dealer plays (only if a hand is still alive), then every hand is settled. */
  function resolveAll(hs: Card[][], sts: number[], d0: Card[], wasSplit: boolean) {
    const alive = hs.some((h) => value(h).total <= 21);
    const d = alive ? dealerPlay(shoe.current, d0) : d0;
    let back = 0;
    const msgs: string[] = [];
    hs.forEach((h, i) => {
      const r = settle(h, d, sts[i], wasSplit);
      back += r.back;
      msgs.push(r.msg);
    });
    if (back > 0) adjust(back);
    const staked = sts.reduce((a, b) => a + b, 0);
    setNet(back - staked);
    setMsg(hs.length > 1 ? msgs.map((m, i) => `Hand ${i + 1}: ${m}`).join(" ") : msgs[0]);
    setDealer(d);
    setHands(hs);
    setStakes(sts);
    setPhase("done");
  }

  /** Move on to the next split hand, or finish the round. */
  function advance(hs: Card[][], sts: number[], i: number) {
    if (i < hs.length - 1) {
      setHands(hs);
      setStakes(sts);
      setIdx(i + 1);
    } else resolveAll(hs, sts, dealer, split);
  }

  function deal() {
    if (bet <= 0 || bet > chips) return;
    adjust(-bet);
    const p = [draw(), draw()];
    const d = [draw(), draw()];
    setMsg("");
    setSplit(false);
    setIdx(0);
    if (isBlackjack(p) || isBlackjack(d)) return resolveAll([p], [bet], d, false);
    setHands([p]);
    setStakes([bet]);
    setDealer(d);
    setPhase("player");
  }

  function hit() {
    const hs = hands.map((h) => [...h]);
    hs[idx].push(draw());
    if (value(hs[idx]).total >= 21) return advance(hs, stakes, idx);
    setHands(hs);
  }

  function stand() {
    advance(hands, stakes, idx);
  }

  function double() {
    const st = stakes[idx];
    if (chips < st || hands[idx].length !== 2) return;
    adjust(-st);
    const hs = hands.map((h) => [...h]);
    const sts = [...stakes];
    sts[idx] = st * 2;
    hs[idx].push(draw());
    advance(hs, sts, idx);
  }

  function doSplit() {
    const h = hands[0];
    const st = stakes[0];
    if (split || hands.length !== 1 || !canSplitPair(h) || chips < st) return;
    adjust(-st);
    const hs = [[h[0], draw()], [h[1], draw()]];
    setSplit(true);
    setHands(hs);
    setStakes([st, st]);
    setIdx(0);
    // Split aces get one card each and stand
    if (h[0].r === 14) resolveAll(hs, [st, st], dealer, true);
  }

  const hideHole = phase === "player";
  const dv = value(hideHole ? dealer.slice(0, 1) : dealer).total;
  const cur = hands[idx] ?? [];
  const canDouble = phase === "player" && chips >= (stakes[idx] ?? 0) && cur.length === 2;
  const canSplit = phase === "player" && !split && hands.length === 1 && canSplitPair(cur) && chips >= (stakes[0] ?? 0);
  const onTable = stakes.reduce((a, b) => a + b, 0);

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
          {hands.map((h, hi) => (
            <div key={hi} className={hands.length > 1 && phase === "player" && hi === idx ? "rounded-lg border border-cc-aqua/60 p-2" : hands.length > 1 ? "p-2" : ""}>
              <div className={label}>
                {hands.length > 1 ? `Hand ${hi + 1}` : "You"} · {value(h).total}
                {hands.length > 1 && ` · bet ${stakes[hi]}`}
              </div>
              <div className="mt-1 flex gap-2">
                {h.map((c, i) => (
                  <CardView key={i} card={c} />
                ))}
              </div>
            </div>
          ))}
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">On the table: {onTable} chips</div>
        </>
      )}

      {phase === "done" && (
        <div className={`rounded-lg border p-3 text-center ${net > 0 ? "border-cc-lime/50 text-cc-lime" : net < 0 ? "border-cc-pink/50 text-cc-pink" : "border-cc-line text-cc-snow"}`}>
          <div className="font-cc text-2xl uppercase">{msg}</div>
          <div className="text-sm">{net > 0 ? `+${net} chips` : net < 0 ? `${net} chips` : "Chips back"}</div>
        </div>
      )}

      {phase === "player" && (
        <div className={`grid gap-2 ${canSplit ? "grid-cols-4" : "grid-cols-3"}`}>
          <Button variant="lime" onClick={hit}>
            Hit
          </Button>
          <Button variant="primary" onClick={stand}>
            Stand
          </Button>
          <Button disabled={!canDouble} onClick={double}>
            Double
          </Button>
          {canSplit && <Button onClick={doSplit}>Split</Button>}
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
          <p className="text-xs text-cc-muted">Blackjack pays 3 to 2. Dealer stands on all 17s. You can double on any two cards and split a pair once. Split aces get one card each.</p>
        </div>
      )}
    </div>
  );
}
