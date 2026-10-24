import { useEffect, useRef, useState } from "react";
import { isMuted, play, setMuted } from "../sound";
import { Blackjack } from "../casino/Blackjack";
import { GondolaRun } from "../casino/GondolaRun";
import { Lobby } from "../casino/Lobby";
import { Poker } from "../casino/Poker";
import { Roulette } from "../casino/Roulette";
import { DAILY_LOG, earnedThisWeek, PER_DOLLAR, WEEKLY_CAP } from "../chips";
import type { Actions } from "../store";
import type { State } from "../types";
import { Card, Empty, Heading, PhotoHeader, Progress, label } from "../ui";

const games = [
  { id: "blackjack", name: "Blackjack", icon: "♠" },
  { id: "roulette", name: "Roulette", icon: "●" },
  { id: "poker", name: "Poker", icon: "♦" },
  { id: "run", name: "Run", icon: "⛷" },
] as const;
type Game = (typeof games)[number]["id"];

export function Casino({ state, actions }: { state: State; actions: Actions }) {
  const [game, setGame] = useState<Game>("blackjack");
  // Game results since you opened the app. Chips you earn from the money habits don't count here.
  const totalEarned = state.chipLog.reduce((a, e) => a + e.amount, 0);
  const sessionStart = useRef({ held: state.chips + state.tableStack, earned: totalEarned });
  const inPlay = state.chips + state.tableStack;
  const sessionNet = inPlay - sessionStart.current.held - (totalEarned - sessionStart.current.earned);
  const earned = earnedThisWeek(state);
  const broke = state.chips === 0 && state.tableStack === 0;
  const [muted, setMute] = useState(isMuted());
  // Win/loss sounds: only when chips moved and it wasn't from earning
  const prev = useRef({ held: inPlay, logged: state.chipLog.length });
  useEffect(() => {
    const p = prev.current;
    if (state.chipLog.length === p.logged && inPlay !== p.held) {
      const d = inPlay - p.held;
      // bets leave the wallet the moment they are placed, so only payouts make a sound
      if (d > 0) play(d >= 500 ? "big" : "win");
    }
    prev.current = { held: inPlay, logged: state.chipLog.length };
  }, [inPlay, state.chipLog.length]);

  return (
    <div
      className="space-y-4"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest("[data-mute]")) play("tick");
      }}
    >
      <PhotoHeader src="/art/tab-casino.webp" title="Casino" sub="Play money only" />
      <Card tone="gold" className="space-y-3" photo="/art/lodge.webp">
        <div className="flex items-end justify-between">
          <div>
            <div className={label}>Chip wallet</div>
            <div className="font-cc text-5xl font-bold leading-none text-cc-gold">{state.chips.toLocaleString()}</div>
            {state.tableStack > 0 && <div className="text-xs text-cc-muted">+ {state.tableStack} at the poker table</div>}
          </div>
          <div className="text-right">
            <button
              data-mute
              className="mb-1 min-h-11 font-mono text-[10px] uppercase tracking-wider text-cc-aqua"
              onClick={() => {
                setMuted(!muted);
                setMute(!muted);
              }}
              aria-pressed={muted}
            >
              Sound {muted ? "off" : "on"}
            </button>
            <div className={label}>Games this visit</div>
            <div className={`font-cc text-2xl ${sessionNet > 0 ? "text-cc-lime" : sessionNet < 0 ? "text-cc-pink" : "text-cc-muted"}`}>
              {sessionNet > 0 ? "+" : ""}
              {sessionNet}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-cc-muted">
            <span>Earned this week</span>
            <span>
              {earned} / {WEEKLY_CAP}
            </span>
          </div>
          <Progress value={earned / WEEKLY_CAP} tone="gold" name="Weekly chip earnings cap" />
        </div>
        <p className="text-xs text-cc-muted">
          Play money only. Chips can't be bought or cashed out. You earn {DAILY_LOG} for logging your day and {PER_DOLLAR} for every real dollar you save.
        </p>
      </Card>

      {broke && (
        <Card tone="pink">
          <Heading tone="pink">Out of chips</Heading>
          <p className="mt-1 text-sm text-cc-muted">That's the game. Log your day and put money toward your savings to earn more, then come back.</p>
        </Card>
      )}

      <Lobby state={state} actions={actions} />

      <div className="grid grid-cols-4 gap-2">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            aria-pressed={game === g.id}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl border font-cc text-base uppercase ${game === g.id ? "border-cc-aqua bg-cc-aqua/15 text-cc-aqua" : "border-cc-line text-cc-muted"}`}
          >
            <span aria-hidden="true">{g.icon}</span>
            {g.name}
          </button>
        ))}
      </div>

      <Card photo="/art/table.webp">
        {game === "blackjack" && <Blackjack chips={state.chips} adjust={actions.adjustChips} />}
        {game === "roulette" && <Roulette chips={state.chips} adjust={actions.adjustChips} />}
        {game === "run" && <GondolaRun state={state} actions={actions} />}
        {game === "poker" && <Poker chips={state.chips} tableStack={state.tableStack} adjust={actions.adjustChips} setTableStack={actions.setTableStack} />}
      </Card>

      <Card>
        <Heading tone="lime">How you earned chips</Heading>
        <div className="mt-3 space-y-2">
          {state.chipLog.length === 0 && <Empty>Log a spend or a no-spend day, or add money to a savings bucket, and chips show up here.</Empty>}
          {state.chipLog.slice(0, 6).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2 text-sm">
              <span>{e.reason}</span>
              <span className="font-cc text-lg text-cc-gold">+{e.amount}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
