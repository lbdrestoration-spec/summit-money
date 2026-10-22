import { useState } from "react";
import { Button, label } from "../ui";
import { CardView, Slot } from "./CardView";
import { BB, BOT_STACK, N, NAMES, legal, playHuman, startHand, type Hand } from "./poker-engine";

type Table = { button: number; stacks: number[] };
const BUYINS = [100, 200, 400];

export function Poker({
  chips,
  tableStack,
  adjust,
  setTableStack,
}: {
  chips: number;
  tableStack: number;
  adjust: (d: number) => void;
  setTableStack: (n: number) => void;
}) {
  const [table, setTable] = useState<Table | null>(null);
  const [hand, setHand] = useState<Hand | null>(null);
  const [buyIn, setBuyIn] = useState(200);

  function deal(stacks: number[], button: number) {
    const s = stacks.map((x, p) => (p === 0 ? x : x < BB * 4 ? BOT_STACK : x));
    setTable({ button, stacks: s });
    setHand(startHand(s, button));
  }

  function sit(amount: number, fromWallet: boolean) {
    if (fromWallet) {
      if (amount > chips) return;
      adjust(-amount);
      setTableStack(amount);
    }
    deal([amount, BOT_STACK, BOT_STACK, BOT_STACK], 0);
  }

  function act(a: "fold" | "call" | "raise") {
    if (!hand) return;
    const next = playHuman(hand, a);
    setHand(next);
    if (next.over) setTableStack(next.stacks[0]);
  }

  function nextHand() {
    if (!hand || !table) return;
    if (hand.stacks[0] < BB) return leave();
    deal(hand.stacks, (table.button + 1) % N);
  }

  function leave() {
    const mine = hand?.over ? hand.stacks[0] : (table?.stacks[0] ?? tableStack);
    if (mine > 0) adjust(mine);
    setTableStack(0);
    setTable(null);
    setHand(null);
  }

  /* ---------- lobby ---------- */
  if (!table || !hand) {
    return (
      <div className="space-y-4">
        {tableStack > 0 ? (
          <div className="space-y-3 rounded-lg border border-cc-gold/50 p-3">
            <p className="text-sm">
              You have <span className="font-cc text-xl text-cc-gold">{tableStack}</span> chips at the table.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="lime" onClick={() => sit(tableStack, false)}>
                Rejoin
              </Button>
              <Button
                onClick={() => {
                  adjust(tableStack);
                  setTableStack(0);
                }}
              >
                Cash out
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-cc-muted">Texas Hold'em against Hudson, Aspen and Vail. Fixed limit, blinds {BB / 2}/{BB}. Pick your buy-in from your chips.</p>
            <div className="grid grid-cols-3 gap-2">
              {BUYINS.map((b) => (
                <Button key={b} variant={buyIn === b ? "primary" : "ghost"} disabled={b > chips} onClick={() => setBuyIn(b)}>
                  {b}
                </Button>
              ))}
            </div>
            <Button variant="lime" className="w-full" disabled={buyIn > chips} onClick={() => sit(buyIn, true)}>
              Sit down with {buyIn}
            </Button>
            {chips < BUYINS[0] && <p className="text-xs text-cc-muted">You need at least {BUYINS[0]} chips to sit down. Log your day and save to earn more.</p>}
          </div>
        )}
      </div>
    );
  }

  /* ---------- table ---------- */
  const lg = legal(hand);
  const myTurn = !hand.over && hand.toAct === 0;
  const r = hand.result;
  const reveal = !!r?.showdown;
  const net = hand.stacks[0] - hand.start[0];
  const winnerText = !r
    ? ""
    : r.winners.length > 1
      ? `${r.winners.map((w) => NAMES[w]).join(" & ")} split the pot`
      : r.winners[0] === 0
        ? "You win"
        : `${NAMES[r.winners[0]]} wins`;
  const winnerHand = r && r.showdown ? r.handNames[r.winners[0]] : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((p) => (
          <div key={p} className={`rounded-lg border p-2 text-center ${hand.toAct === p ? "border-cc-aqua" : "border-cc-line"} ${hand.folded[p] ? "opacity-50" : ""}`}>
            <div className="flex justify-center gap-1">
              {hand.hole[p].map((c, i) => (
                <CardView key={i} small card={reveal && !hand.folded[p] ? c : null} />
              ))}
            </div>
            <div className="mt-1 truncate text-xs">
              {NAMES[p]}
              {hand.button === p && <span className="ml-1 rounded bg-cc-gold px-1 text-[9px] font-bold text-cc-night">D</span>}
            </div>
            <div className="font-cc text-lg text-cc-gold">{hand.stacks[p]}</div>
            <div className="h-4 text-[10px] text-cc-muted">{hand.folded[p] ? "Folded" : hand.allIn[p] ? "All in" : hand.bets[p] > 0 ? `Bet ${hand.bets[p]}` : ""}</div>
            {reveal && !hand.folded[p] && <div className="text-[10px] text-cc-aqua">{r?.handNames[p]}</div>}
          </div>
        ))}
      </div>

      <div className="space-y-2 text-center">
        <div className={label}>Pot {lg.pot}</div>
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (hand.board[i] ? <CardView key={i} card={hand.board[i]} /> : <Slot key={i} />))}
        </div>
        <div className="min-h-8 text-xs text-cc-muted">{hand.log.slice(-3).join(" · ")}</div>
      </div>

      <div className="rounded-lg border border-cc-line p-3">
        <div className="flex items-center justify-between">
          <span className={label}>
            You {hand.button === 0 && <span className="ml-1 rounded bg-cc-gold px-1 text-[9px] font-bold text-cc-night">D</span>}
          </span>
          <span className="font-cc text-2xl text-cc-gold">{hand.stacks[0]}</span>
        </div>
        <div className="mt-2 flex justify-center gap-2">
          {hand.hole[0].map((c, i) => (
            <CardView key={i} card={hand.folded[0] ? null : c} />
          ))}
        </div>
      </div>

      {hand.over && r ? (
        <div className="space-y-3">
          <div className={`rounded-lg border p-3 text-center ${net > 0 ? "border-cc-lime/50 text-cc-lime" : net < 0 ? "border-cc-pink/50 text-cc-pink" : "border-cc-line"}`}>
            <div className="font-cc text-2xl uppercase">{winnerText}</div>
            <div className="text-sm text-cc-snow">
              {winnerHand ? `with ${winnerHand}` : "everyone else folded"} · you {net >= 0 ? "+" : ""}
              {net}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={leave}>Leave table</Button>
            <Button variant="lime" onClick={nextHand} disabled={hand.stacks[0] < BB}>
              Next hand
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="danger" disabled={!myTurn} onClick={() => act("fold")}>
            Fold
          </Button>
          <Button variant="primary" disabled={!myTurn} onClick={() => act("call")}>
            {lg.toCall === 0 ? "Check" : `Call ${lg.toCall}`}
          </Button>
          <Button variant="lime" disabled={!myTurn || !lg.canRaise} onClick={() => act("raise")}>
            Raise to {lg.raiseTo}
          </Button>
        </div>
      )}
    </div>
  );
}
