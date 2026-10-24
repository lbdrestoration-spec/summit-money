import { makeShoe, type Card } from "./cards";
import { best7, category, handName } from "./poker-eval";

export const N = 4; // you + 3 bots
export const SB = 5;
export const BB = 10;
export const MAX_RAISES = 3;
export const BOT_STACK = 200;
export const NAMES = ["You", "Hudson", "Aspen", "Vail"];
/** How each bot plays. need: extra strength wanted to stay in. raiseAt: strength that makes it raise. bluff: chance to raise for free. */
export type Style = { tag: string; need: number; raiseAt: number; bluff: number; stubborn: number };
export const STYLES: (Style | null)[] = [
  null,
  { tag: "Tight", need: 0.08, raiseAt: 0.82, bluff: 0.02, stubborn: 0.06 },
  { tag: "Aggressive", need: -0.08, raiseAt: 0.6, bluff: 0.16, stubborn: 0.2 },
  { tag: "Balanced", need: 0, raiseAt: 0.74, bluff: 0.06, stubborn: 0.12 },
];
export type Action = "fold" | "call" | "raise";

export type Result = {
  payouts: number[];
  showdown: boolean;
  winners: number[];
  handNames: (string | null)[];
};

export type Hand = {
  button: number;
  start: number[];
  stacks: number[];
  bets: number[];
  committed: number[];
  folded: boolean[];
  allIn: boolean[];
  acted: boolean[];
  hole: Card[][];
  board: Card[];
  deck: Card[];
  street: number; // 0 preflop, 1 flop, 2 turn, 3 river
  currentBet: number;
  raises: number;
  toAct: number; // -1 once the hand is over
  over: boolean;
  result: Result | null;
  log: string[];
};

const betSize = (street: number) => (street < 2 ? BB : BB * 2);
const pot = (h: Hand) => h.committed.reduce((a, b) => a + b, 0);
const live = (h: Hand) => [...Array(N).keys()].filter((p) => !h.folded[p]);

function post(h: Hand, p: number, amt: number) {
  const a = Math.max(0, Math.min(amt, h.stacks[p]));
  h.stacks[p] -= a;
  h.bets[p] += a;
  h.committed[p] += a;
  if (h.stacks[p] === 0) h.allIn[p] = true;
  return a;
}

function nextActor(h: Hand, from: number) {
  for (let i = 1; i <= N; i++) {
    const p = (from + i) % N;
    if (!h.folded[p] && !h.allIn[p] && (!h.acted[p] || h.bets[p] < h.currentBet)) return p;
  }
  return -1;
}

function sidePots(h: Hand) {
  const levels = [...new Set(h.committed.filter((c) => c > 0))].sort((a, b) => a - b);
  const pots: { amount: number; eligible: number[] }[] = [];
  let prev = 0;
  for (const lv of levels) {
    let amount = 0;
    for (let p = 0; p < N; p++) amount += Math.max(0, Math.min(h.committed[p], lv) - prev);
    let eligible = [...Array(N).keys()].filter((p) => !h.folded[p] && h.committed[p] >= lv);
    if (eligible.length === 0) eligible = live(h);
    pots.push({ amount, eligible });
    prev = lv;
  }
  return pots;
}

function finish(h: Hand, payouts: number[], showdown: boolean, winners: number[], handNames: (string | null)[]) {
  for (let p = 0; p < N; p++) h.stacks[p] += payouts[p];
  h.over = true;
  h.toAct = -1;
  h.result = { payouts, showdown, winners, handNames };
}

function showdown(h: Hand) {
  const alive = live(h);
  const scores = new Map<number, number>();
  for (const p of alive) scores.set(p, best7([...h.hole[p], ...h.board]));
  const payouts = Array(N).fill(0);
  const won = new Set<number>();
  for (const sp of sidePots(h)) {
    const top = Math.max(...sp.eligible.map((p) => scores.get(p) ?? -1));
    const winners = sp.eligible.filter((p) => scores.get(p) === top);
    const share = Math.floor(sp.amount / winners.length);
    winners.forEach((w) => {
      payouts[w] += share;
      won.add(w);
    });
    payouts[winners[0]] += sp.amount - share * winners.length;
  }
  const names = Array.from({ length: N }, (_, p) => (scores.has(p) ? handName(scores.get(p) as number) : null));
  finish(h, payouts, true, [...won], names);
}

function deal(h: Hand) {
  const n = h.street === 1 ? 3 : 1;
  for (let i = 0; i < n; i++) h.board.push(h.deck.pop() as Card);
}

function endStreet(h: Hand) {
  h.bets.fill(0);
  h.acted.fill(false);
  h.currentBet = 0;
  h.raises = 0;
  if (h.street === 3) return showdown(h);
  h.street++;
  deal(h);
  const canAct = live(h).filter((p) => !h.allIn[p]);
  if (canAct.length <= 1) {
    while (h.street < 3) {
      h.street++;
      deal(h);
    }
    return showdown(h);
  }
  h.toAct = nextActor(h, h.button);
}

function afterAction(h: Hand, p: number) {
  const alive = live(h);
  if (alive.length === 1) {
    const payouts = Array(N).fill(0);
    payouts[alive[0]] = pot(h);
    return finish(h, payouts, false, [alive[0]], Array(N).fill(null));
  }
  const nxt = nextActor(h, p);
  if (nxt !== -1) {
    h.toAct = nxt;
    return;
  }
  endStreet(h);
}

function apply(h: Hand, p: number, action: Action) {
  const toCall = Math.max(0, h.currentBet - h.bets[p]);
  let a = action;
  if (a === "fold" && toCall === 0) a = "call"; // folding for free is just a check
  if (a === "raise" && (h.raises >= MAX_RAISES || h.stacks[p] <= toCall)) a = "call";
  if (a === "fold") {
    h.folded[p] = true;
    h.log.push(`${NAMES[p]} folds`);
  } else if (a === "call") {
    const put = post(h, p, toCall);
    h.log.push(toCall === 0 ? `${NAMES[p]} checks` : `${NAMES[p]} calls ${put}`);
  } else {
    post(h, p, h.currentBet + betSize(h.street) - h.bets[p]);
    if (h.bets[p] > h.currentBet) {
      h.currentBet = h.bets[p];
      h.raises++;
      h.acted.fill(false);
    }
    h.log.push(`${NAMES[p]} raises to ${h.bets[p]}`);
  }
  h.acted[p] = true;
  afterAction(h, p);
}

/* ---------- bots ---------- */
function strength(h: Hand, p: number) {
  const [x, y] = h.hole[p];
  if (h.board.length === 0) {
    const hi = Math.max(x.r, y.r);
    const lo = Math.min(x.r, y.r);
    if (x.r === y.r) return Math.min(1, 0.5 + (hi / 14) * 0.45);
    let s = 0.1 + ((hi + lo) / 28) * 0.4;
    if (x.s === y.s) s += 0.06;
    if (hi - lo <= 2) s += 0.05;
    if (hi >= 12) s += 0.05;
    return Math.min(0.75, s);
  }
  const sc = best7([...h.hole[p], ...h.board]);
  const cat = category(sc);
  const k1 = Math.floor(sc / 15 ** 4) % 15;
  if (cat === 0) return 0.1 + (k1 / 14) * 0.15;
  if (cat === 1) return 0.3 + (k1 / 14) * 0.25;
  return [0, 0, 0.7, 0.8, 0.86, 0.9, 0.95, 0.98, 1][cat];
}

function botAction(h: Hand, p: number): Action {
  const toCall = Math.max(0, h.currentBet - h.bets[p]);
  const s = strength(h, p);
  const canRaise = h.raises < MAX_RAISES && h.stacks[p] > toCall;
  const r = Math.random();
  const st = STYLES[p] ?? STYLES[3]!;
  if (toCall === 0) return canRaise && ((s > st.raiseAt - 0.12 && r < 0.65) || r < st.bluff) ? "raise" : "call";
  if (s > st.raiseAt && canRaise && r < 0.5) return "raise";
  const need = 0.28 + st.need + (toCall > BB ? 0.1 : 0) + h.raises * 0.06;
  if (s < need && r > st.stubborn) return "fold";
  return "call";
}

function runBots(h: Hand) {
  for (let guard = 0; guard < 200 && !h.over && h.toAct !== 0; guard++) apply(h, h.toAct, botAction(h, h.toAct));
}

/* ---------- public api ---------- */
export function startHand(stacks: number[], button: number): Hand {
  const deck = makeShoe(1);
  const h: Hand = {
    button,
    start: [...stacks],
    stacks: [...stacks],
    bets: Array(N).fill(0),
    committed: Array(N).fill(0),
    folded: Array(N).fill(false),
    allIn: Array(N).fill(false),
    acted: Array(N).fill(false),
    hole: Array.from({ length: N }, () => [deck.pop() as Card, deck.pop() as Card]),
    board: [],
    deck,
    street: 0,
    currentBet: BB,
    raises: 0,
    toAct: -1,
    over: false,
    result: null,
    log: [],
  };
  const sb = (button + 1) % N;
  const bb = (button + 2) % N;
  post(h, sb, SB);
  post(h, bb, BB);
  h.toAct = nextActor(h, bb);
  if (h.toAct === -1) endStreet(h);
  runBots(h);
  return h;
}

export function playHuman(prev: Hand, action: Action): Hand {
  if (prev.over || prev.toAct !== 0) return prev;
  const h = structuredClone(prev);
  apply(h, 0, action);
  runBots(h);
  return h;
}

export function legal(h: Hand) {
  const toCall = Math.max(0, h.currentBet - h.bets[0]);
  return {
    toCall: Math.min(toCall, h.stacks[0]),
    canRaise: h.raises < MAX_RAISES && h.stacks[0] > toCall,
    raiseTo: Math.min(h.currentBet + betSize(h.street), h.bets[0] + h.stacks[0]),
    pot: pot(h),
  };
}
