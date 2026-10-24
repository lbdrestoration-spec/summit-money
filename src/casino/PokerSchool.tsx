import { useState } from "react";
import { play } from "../sound";
import { Button, label } from "../ui";
import { CardView } from "./CardView";
import { newDeal, type Verdict } from "./school-logic";

/** Practice reading a showdown: who wins? No chips involved, just the habit. */
export function PokerSchool() {
  const [deal, setDeal] = useState(() => newDeal());
  const [pick, setPick] = useState<Verdict | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [asked, setAsked] = useState(0);

  const answer = (v: Verdict) => {
    if (pick) return;
    setPick(v);
    setAsked(asked + 1);
    if (v === deal.verdict) {
      play("win");
      setStreak(streak + 1);
      setBest(Math.max(best, streak + 1));
    } else {
      play("lose");
      setStreak(0);
    }
  };
  const next = () => {
    setDeal(newDeal());
    setPick(null);
  };
  const right = pick === deal.verdict;
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div className={label}>Poker school: who wins?</div>
        <div className="text-right font-mono text-[10px] uppercase text-cc-muted">
          Streak {streak} · Best {best}
        </div>
      </div>
      <div className="flex justify-center gap-1.5" role="group" aria-label="Board">
        {deal.board.map((c, i) => (
          <CardView key={i} card={c} small />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([
          ["Hand A", deal.a],
          ["Hand B", deal.b],
        ] as const).map(([name, cards]) => (
          <div key={name} className="space-y-1 text-center" role="group" aria-label={name}>
            <div className={label}>{name}</div>
            <div className="flex justify-center gap-1.5">
              {cards.map((c, i) => (
                <CardView key={i} card={c} small />
              ))}
            </div>
          </div>
        ))}
      </div>
      {pick ? (
        <>
          <p className="text-center text-sm" aria-live="polite">
            {right ? "Right. " : "Not quite. "}
            {deal.verdict === "split" ? "It's a split pot." : `Hand ${deal.verdict} wins.`} A makes {deal.aName.toLowerCase()}; B makes {deal.bName.toLowerCase()}.
          </p>
          <Button className="w-full" onClick={next}>
            Next deal
          </Button>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="lime" onClick={() => answer("A")}>
            A wins
          </Button>
          <Button variant="lime" onClick={() => answer("B")}>
            B wins
          </Button>
          <Button variant="ghost" onClick={() => answer("split")}>
            Split
          </Button>
        </div>
      )}
      <p className="text-xs text-cc-muted">{asked} dealt this visit. Each hand makes its best five from the board plus its two cards.</p>
    </div>
  );
}
