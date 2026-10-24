export const SLOT_BETS = [5, 10, 25, 50];

/** Symbols, how often each shows on a reel (weight) and the multiplier for three in a row. */
export const SYMBOLS: { s: string; name: string; w: number; pay: number }[] = [
  { s: "❄️", name: "snowflake", w: 8, pay: 8 },
  { s: "🌲", name: "pine", w: 6, pay: 12 },
  { s: "🏂", name: "rider", w: 4, pay: 18 },
  { s: "⛰️", name: "peak", w: 3, pay: 35 },
  { s: "⭐", name: "star", w: 2, pay: 80 },
  { s: "💰", name: "bag", w: 1, pay: 250 },
];
export const TOTAL = SYMBOLS.reduce((a, x) => a + x.w, 0);
/** Two matching on the first two reels (but not three) gives the stake back. */
export const PAIR_PAY = 1;

/** Pick a symbol index using r in [0, 1). */
export function pick(r: number): number {
  let t = r * TOTAL;
  for (let i = 0; i < SYMBOLS.length; i++) {
    t -= SYMBOLS[i].w;
    if (t < 0) return i;
  }
  return SYMBOLS.length - 1;
}

export const spin = (rng: () => number): [number, number, number] => [pick(rng()), pick(rng()), pick(rng())];

/** Chips returned for a stake (the stake itself is taken separately). */
export function payout(reels: [number, number, number], bet: number): number {
  const [a, b, c] = reels;
  if (a === b && b === c) return bet * SYMBOLS[a].pay;
  if (a === b) return bet * PAIR_PAY;
  return 0;
}

/** Exact return to player, worked out over every outcome. */
export function rtp(): number {
  let total = 0;
  for (let a = 0; a < SYMBOLS.length; a++)
    for (let b = 0; b < SYMBOLS.length; b++)
      for (let c = 0; c < SYMBOLS.length; c++) {
        const p = (SYMBOLS[a].w * SYMBOLS[b].w * SYMBOLS[c].w) / TOTAL ** 3;
        total += p * payout([a, b, c], 1);
      }
  return total;
}
