import { useMemo, useState } from "react";
import { play } from "../sound";
import { iso, today } from "../calc";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, label } from "../ui";
import { readTicket, rollPrize, ticket } from "./scratch";

/** One free scratch card a day. Tap tiles to scratch; three matching symbols win chips. */
export function ScratchCard({ state, actions }: { state: State; actions: Actions }) {
  const date = iso(today());
  const used = state.daily.scratch === date;
  const [tiles, setTiles] = useState<string[] | null>(null);
  const [open, setOpen] = useState<boolean[]>(Array(9).fill(false));
  const prize = useMemo(() => (tiles ? readTicket(tiles) : 0), [tiles]);
  const all = open.every(Boolean);

  const start = () => {
    if (used) return;
    const p = rollPrize(Math.random());
    setTiles(ticket(p, Math.random));
    setOpen(Array(9).fill(false));
    // the ticket is spent and paid the moment you take it, so closing the app can't dodge a result
    actions.scratchDaily(date, p);
    play("tick");
  };
  const reveal = (i: number) => {
    setOpen((o) => {
      if (o[i]) return o;
      const n = [...o];
      n[i] = true;
      if (n.every(Boolean)) play(prize >= 100 ? "big" : prize > 0 ? "win" : "lose");
      return n;
    });
  };

  return (
    <Card tone="gold" className="space-y-3">
      <Heading tone="gold">Daily scratch card</Heading>
      {tiles ? (
        <>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Scratch card tiles">
            {tiles.map((s, i) => (
              <button
                key={i}
                onClick={() => reveal(i)}
                aria-label={open[i] ? `Tile ${i + 1}: ${s}` : `Scratch tile ${i + 1}`}
                className={`flex h-16 items-center justify-center rounded-xl border text-3xl ${open[i] ? "border-cc-line bg-cc-night" : "border-cc-gold/60 bg-cc-gold/20 text-cc-gold"}`}
              >
                {open[i] ? s : "?"}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm" aria-live="polite">
              {all ? (prize > 0 ? `Three matching! +${prize} chips.` : "No match today. Come back tomorrow.") : "Scratch all nine tiles."}
            </p>
            {!all && (
              <Button variant="ghost" onClick={() => setOpen(Array(9).fill(true))}>
                Reveal all
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={label}>{used ? "Scratched today. New card tomorrow." : "Free once a day. Match three symbols to win up to 250 chips."}</div>
          <Button className="w-full" disabled={used} onClick={start}>
            {used ? "Done for today" : "Get today's card"}
          </Button>
        </>
      )}
    </Card>
  );
}
