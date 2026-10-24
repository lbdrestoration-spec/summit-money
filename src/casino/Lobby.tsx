import { useState } from "react";
import { iso, today } from "../calc";
import { buzz } from "../haptic";
import { play } from "../sound";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, label } from "../ui";
import { angleFor, allDone, CHEST, missions, SEG_ANGLE, SEGMENTS } from "./daily";
import { randInt } from "./rng";

const COLORS = ["#c8415a", "#16314f", "#c9a15a", "#16314f", "#c8415a", "#16314f", "#c9a15a", "#5fb04a"];

function arc(i: number) {
  const a0 = (i * SEG_ANGLE - 90) * (Math.PI / 180);
  const a1 = ((i + 1) * SEG_ANGLE - 90) * (Math.PI / 180);
  const p = (a: number) => `${(60 + 56 * Math.cos(a)).toFixed(2)} ${(60 + 56 * Math.sin(a)).toFixed(2)}`;
  return `M60 60 L${p(a0)} A56 56 0 0 1 ${p(a1)} Z`;
}

/** Casino lobby: one free wheel spin a day and a short mission list that opens a chest. */
export function Lobby({ state, actions }: { state: State; actions: Actions }) {
  const date = iso(today());
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const spun = state.daily.wheel === date;
  const list = missions(state, date);
  const ready = allDone(state, date);
  const opened = state.daily.chest === date;

  const spin = () => {
    if (spun || spinning) return;
    const i = randInt(SEGMENTS.length);
    setSpinning(true);
    setRot(angleFor(i));
    play("tick");
    window.setTimeout(() => {
      setSpinning(false);
      setWon(SEGMENTS[i]);
      actions.spinDaily(date, SEGMENTS[i]);
      buzz([30, 30, 60]);
      play(SEGMENTS[i] >= 100 ? "big" : "win");
    }, 2600);
  };

  return (
    <Card tone="gold" className="space-y-4" photo="/art/gondola.webp">
      <Heading tone="gold">Daily lobby</Heading>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0" role="img" aria-label={won === null ? "Daily prize wheel" : `Daily prize wheel, landed on ${won} chips`}>
          <svg viewBox="0 0 120 120" className="h-full w-full" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? "transform 2.5s cubic-bezier(0.12, 0.7, 0.2, 1)" : "none" }}>
            {SEGMENTS.map((v, i) => (
              <g key={i}>
                <path d={arc(i)} fill={COLORS[i]} stroke="#c9a15a" strokeWidth="0.6" />
                <text x="60" y="20" fontSize="9" fontWeight="700" textAnchor="middle" fill="#f1f6fb" transform={`rotate(${i * SEG_ANGLE + SEG_ANGLE / 2} 60 60)`}>
                  {v}
                </text>
              </g>
            ))}
            <circle cx="60" cy="60" r="9" fill="#1a2a3f" stroke="#c9a15a" />
          </svg>
          <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[12px] border-x-transparent border-t-cc-snow" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm" aria-live="polite">
            {spun ? (won !== null ? `You won ${won} chips.` : "Spun today. Back tomorrow.") : "One free spin a day. Chips only, never money."}
          </p>
          <Button onClick={spin} disabled={spun || spinning}>
            {spinning ? "Spinning..." : spun ? "Spun today" : "Spin the wheel"}
          </Button>
        </div>
      </div>
      <div>
        <div className={label}>Today's missions</div>
        <ul className="mt-2 space-y-1">
          {list.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className={m.done ? "text-cc-lime" : "text-cc-muted"}>
                {m.done ? "✓" : "○"}
              </span>
              <span className={m.done ? "text-cc-muted line-through" : ""}>{m.label}</span>
              <span className="sr-only">{m.done ? "done" : "not done"}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-3" variant="lime" disabled={!ready || opened} onClick={() => actions.claimChest(date)}>
          {opened ? "Chest opened today" : ready ? `Open chest (+${CHEST})` : "Finish all four to open the chest"}
        </Button>
      </div>
    </Card>
  );
}
