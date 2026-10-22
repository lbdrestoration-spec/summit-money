import { useRef, useState } from "react";
import { Blackjack } from "../casino/Blackjack";
import { Poker } from "../casino/Poker";
import { Roulette } from "../casino/Roulette";
import { DAILY_LOG, earnedThisWeek, PER_DOLLAR, WEEKLY_CAP } from "../chips";
import type { Actions } from "../store";
import type { State } from "../types";
import { Card, Empty, Heading, Progress, label } from "../ui";

const games = [
  { id: "blackjack", name: "Blackjack", icon: "♠" },
  { id: "roulette", name: "Roulette", icon: "●" },
  { id: "poker", name: "Poker", icon: "♦" },
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

  return (
    <div className="space-y-4">
      <Card tone="gold" className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className={label}>Chip wallet</div>
            <div className="font-cc text-5xl font-bold leading-none text-cc-gold">{state.chips.toLocaleString()}</div>
            {state.tableStack > 0 && <div className="text-xs text-cc-muted">+ {state.tableStack} at the poker table</div>}
          </div>
          <div className="text-right">
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
          <Progress value={earned / WEEKLY_CAP} tone="gold" />
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

      <div className="grid grid-cols-3 gap-2">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            aria-pressed={game === g.id}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl border font-cc text-lg uppercase ${game === g.id ? "border-cc-aqua bg-cc-aqua/15 text-cc-aqua" : "border-cc-line text-cc-muted"}`}
          >
            <span aria-hidden="true">{g.icon}</span>
            {g.name}
          </button>
        ))}
      </div>

      <Card>
        {game === "blackjack" && <Blackjack chips={state.chips} adjust={actions.adjustChips} />}
        {game === "roulette" && <Roulette chips={state.chips} adjust={actions.adjustChips} />}
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
