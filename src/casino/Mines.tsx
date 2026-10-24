import { useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { cashValue, MINE_BETS, MINE_CHOICES, multiplier, placeMines, SIZE } from "./mines-logic";

type Round = { bet: number; mines: number; slides: Set<number>; open: Set<number> };

/** Avalanche: reveal safe snow tiles and cash out before you hit a slide. */
export function Mines({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [bet, setBet] = useState(10);
  const [mines, setMines] = useState(3);
  const [round, setRound] = useState<Round | null>(null);
  const [over, setOver] = useState<null | { slides: Set<number>; open: Set<number> }>(null);
  const [msg, setMsg] = useState("");

  const start = () => {
    if (bet > chips) return;
    adjust(-bet);
    setRound({ bet, mines, slides: placeMines(mines, Math.random), open: new Set() });
    setOver(null);
    setMsg("");
    play("tick");
  };
  const safeCount = round ? round.open.size : 0;
  const reveal = (i: number) => {
    if (!round || round.open.has(i)) return;
    if (round.slides.has(i)) {
      play("lose");
      setOver({ slides: round.slides, open: round.open });
      setMsg(`Avalanche! You lost ${round.bet}.`);
      setRound(null);
      return;
    }
    const open = new Set(round.open).add(i);
    play("tick");
    if (open.size === SIZE - round.mines) {
      // cleared the whole board: pay out automatically
      const v = cashValue(round.bet, round.mines, open.size);
      adjust(v);
      play("big");
      setOver({ slides: round.slides, open });
      setMsg(`Cleared the mountain! Cashed out ${v} chips.`);
      setRound(null);
      return;
    }
    setRound({ ...round, open });
  };
  const cash = () => {
    if (!round || safeCount === 0) return;
    const v = cashValue(round.bet, round.mines, safeCount);
    adjust(v);
    play(v >= round.bet * 5 ? "big" : "win");
    setOver({ slides: round.slides, open: round.open });
    setMsg(`Cashed out ${v} chips after ${safeCount} safe.`);
    setRound(null);
  };

  const open = round?.open ?? over?.open ?? new Set<number>();
  const slides = over?.slides ?? new Set<number>();
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Avalanche</div>
        <div className="font-cc text-xl text-cc-gold">{chips}</div>
      </div>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Snow tiles">
        {Array.from({ length: SIZE }, (_, i) => {
          const isOpen = open.has(i);
          const isSlide = slides.has(i);
          return (
            <button
              key={i}
              disabled={!round}
              onClick={() => reveal(i)}
              aria-label={isOpen ? `Tile ${i + 1}: safe` : isSlide ? `Tile ${i + 1}: avalanche` : `Tile ${i + 1}`}
              className={`flex h-12 items-center justify-center rounded-lg border text-xl ${isOpen ? "border-cc-lime bg-cc-lime/15" : isSlide ? "border-cc-orange bg-cc-orange/15" : "border-cc-line bg-cc-night"}`}
            >
              {isOpen ? "❄️" : isSlide ? "💥" : ""}
            </button>
          );
        })}
      </div>
      {round ? (
        <>
          <div className="text-center text-sm" aria-live="polite">
            {safeCount} safe · now worth <span className="font-cc text-lg text-cc-gold">{cashValue(round.bet, round.mines, safeCount)}</span> · next {multiplier(round.mines, safeCount + 1).toFixed(2)}x
          </div>
          <Button className="w-full" disabled={safeCount === 0} onClick={cash}>
            Cash out {safeCount > 0 ? cashValue(round.bet, round.mines, safeCount) : ""}
          </Button>
        </>
      ) : (
        <>
          {msg && (
            <p className="text-center text-sm" aria-live="polite">
              {msg}
            </p>
          )}
          <div className={label}>Avalanches on the board</div>
          <div className="grid grid-cols-3 gap-2">
            {MINE_CHOICES.map((m) => (
              <Button key={m} variant={mines === m ? "primary" : "ghost"} onClick={() => setMines(m)}>
                {m}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MINE_BETS.map((b) => (
              <Button key={b} variant={bet === b ? "primary" : "ghost"} disabled={b > chips} onClick={() => setBet(b)}>
                {b}
              </Button>
            ))}
          </div>
          <Button className="w-full" disabled={bet > chips} onClick={start}>
            Start ({bet})
          </Button>
          <p className="text-xs text-cc-muted">Tap tiles to find safe snow. Every safe tile raises the payout; hit an avalanche and the stake is gone. Cash out any time.</p>
        </>
      )}
    </div>
  );
}
