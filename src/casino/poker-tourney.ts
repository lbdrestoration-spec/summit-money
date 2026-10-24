import { N, startHand, type Hand } from "./poker-engine";

export const START_STACK = 1000;
export const BUY_IN = 100;
export const HANDS_PER_LEVEL = 4;
export const LEVELS: [number, number][] = [
  [10, 20],
  [20, 40],
  [30, 60],
  [50, 100],
  [100, 200],
  [200, 400],
  [400, 800],
];

export type Tour = { stacks: number[]; out: boolean[]; button: number; handNo: number; places: (number | null)[] };

export const startTour = (): Tour => ({
  stacks: Array(N).fill(START_STACK),
  out: Array(N).fill(false),
  button: 0,
  handNo: 0,
  places: Array(N).fill(null),
});

export const blindsFor = (handNo: number): [number, number] => LEVELS[Math.min(Math.floor(handNo / HANDS_PER_LEVEL), LEVELS.length - 1)];
export const levelOf = (handNo: number) => Math.min(Math.floor(handNo / HANDS_PER_LEVEL), LEVELS.length - 1) + 1;
export const active = (t: Tour) => t.out.filter((o) => !o).length;
export const finished = (t: Tour) => active(t) <= 1 || t.out[0];

export function dealNext(t: Tour): Hand {
  const [sb, bb] = blindsFor(t.handNo);
  return startHand(t.stacks, t.button, { sb, bb, out: t.out });
}

/** Fold a finished hand back into the tournament: stacks, busts, finishing places, next button. */
export function afterHand(t: Tour, h: Hand): Tour {
  const stacks = [...h.stacks];
  const out = [...t.out];
  const places = [...t.places];
  const before = active(t);
  const busted = [...Array(N).keys()].filter((p) => !t.out[p] && stacks[p] <= 0).sort((a, b) => h.start[b] - h.start[a]);
  const remaining = before - busted.length;
  busted.forEach((p, i) => {
    out[p] = true;
    places[p] = remaining + 1 + i;
  });
  if (remaining === 1) {
    const w = [...Array(N).keys()].find((p) => !out[p]) as number;
    places[w] = 1;
  }
  let button = t.button;
  for (let i = 1; i <= N; i++) {
    const c = (t.button + i) % N;
    if (!out[c]) {
      button = c;
      break;
    }
  }
  return { stacks, out, button, handNo: t.handNo + 1, places };
}

/** Chips paid for a finishing place. Only first and second pay, and the total is less than the buy-ins. */
export const prizeFor = (place: number | null, buyIn = BUY_IN) => (place === 1 ? Math.round(buyIn * 2.5) : place === 2 ? Math.round(buyIn * 0.5) : 0);
