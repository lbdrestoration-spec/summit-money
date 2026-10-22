import { useEffect, useRef, useState } from "react";
import { Button, label } from "../ui";
import { colorOf, payout } from "./roulette-logic";
import { randInt } from "./rng";

const SIZES = [10, 50, 100, 500];
const numBg = { red: "bg-cc-pink/80 text-cc-snow", black: "bg-cc-night text-cc-snow border border-cc-line", green: "bg-cc-lime text-cc-night" } as const;

export function Roulette({ chips, adjust }: { chips: number; adjust: (d: number) => void }) {
  const [size, setSize] = useState(10);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [spinning, setSpinning] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const timers = useRef<number[]>([]);
  useEffect(
    () => () =>
      timers.current.forEach((t) => {
        window.clearInterval(t);
        window.clearTimeout(t);
      }),
    [],
  );

  const total = Object.values(bets).reduce((a, b) => a + b, 0);
  const free = chips - total;

  const place = (key: string) => {
    if (spinning || size > free) return;
    setBets((b) => ({ ...b, [key]: (b[key] ?? 0) + size }));
  };

  function spin() {
    if (spinning || total <= 0 || total > chips) return;
    const result = randInt(37);
    const placed = { ...bets };
    const staked = total;
    adjust(-staked);
    setSpinning(true);
    setMsg("");
    const flick = window.setInterval(() => setShown(randInt(37)), 70);
    const done = window.setTimeout(() => {
      window.clearInterval(flick);
      setShown(result);
      const back = payout(placed, result);
      if (back > 0) adjust(back);
      setHistory((h) => [result, ...h].slice(0, 12));
      setMsg(back > staked ? `+${back - staked} chips` : back > 0 ? "Chips back" : `-${staked} chips`);
      setSpinning(false);
      setBets({});
    }, 2000);
    timers.current.push(flick, done);
  }

  const Chip = ({ k }: { k: string }) =>
    bets[k] ? <span className="absolute -right-1 -top-1 rounded-full bg-cc-gold px-1.5 text-[10px] font-bold leading-4 text-cc-night">{bets[k]}</span> : null;

  const spot = (key: string, text: string, cls = "", sub?: string) => (
    <button
      key={key}
      type="button"
      disabled={spinning}
      onClick={() => place(key)}
      className={`relative flex min-h-10 w-full flex-col items-center justify-center rounded-md text-sm font-semibold active:opacity-70 disabled:opacity-60 ${cls}`}
    >
      {text}
      {sub && <span className="text-[9px] font-normal opacity-70">{sub}</span>}
      <Chip k={key} />
    </button>
  );

  const rows = Array.from({ length: 12 }, (_, i) => [3 * i + 1, 3 * i + 2, 3 * i + 3]);
  const shownColor = shown === null ? "black" : colorOf(shown);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full font-cc text-4xl font-bold ${shown === null ? "border border-dashed border-cc-line text-cc-muted" : numBg[shownColor]}`}>
          {shown ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className={label}>{spinning ? "No more bets" : msg || "Place your bets"}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {history.map((n, i) => (
              <span key={i} className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${numBg[colorOf(n)]}`}>
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {spot("n:0", "0", numBg.green)}
        <div className="grid grid-cols-3 gap-1.5">
          {rows.flat().map((n) => spot(`n:${n}`, String(n), numBg[colorOf(n)]))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {spot("d1", "1st 12", "bg-cc-line/60", "pays 2 to 1")}
          {spot("d2", "2nd 12", "bg-cc-line/60", "pays 2 to 1")}
          {spot("d3", "3rd 12", "bg-cc-line/60", "pays 2 to 1")}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {spot("low", "1-18", "bg-cc-line/60")}
          {spot("even", "Even", "bg-cc-line/60")}
          {spot("odd", "Odd", "bg-cc-line/60")}
          {spot("high", "19-36", "bg-cc-line/60")}
          {spot("red", "Red", numBg.red)}
          {spot("black", "Black", numBg.black)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={label}>Chip size</span>
          <span className="text-sm text-cc-muted">
            Bet <span className="font-cc text-2xl text-cc-gold">{total}</span>
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((s) => (
            <Button key={s} variant={size === s ? "primary" : "ghost"} onClick={() => setSize(s)}>
              {s}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={spinning || total === 0} onClick={() => setBets({})}>
            Clear bets
          </Button>
          <Button variant="lime" disabled={spinning || total === 0} onClick={spin}>
            {spinning ? "Spinning..." : "Spin"}
          </Button>
        </div>
        <p className="text-xs text-cc-muted">Single-zero wheel. Straight-up pays 35 to 1. Zero loses every outside bet.</p>
      </div>
    </div>
  );
}
