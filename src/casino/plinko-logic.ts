import { randInt } from "./rng";

export const ROWS = 10;
export type Risk = "low" | "mid" | "high";
export const RISKS: Risk[] = ["low", "mid", "high"];
export const PLINKO_BETS = [10, 20, 50, 100];

// Half-tables (buckets 0..5), mirrored to 11 buckets. Center bucket is the most likely.
const HALF: Record<Risk, number[]> = {
  low: [4, 2, 1.4, 1.1, 0.9, 0.6],
  mid: [10, 4, 2, 1.2, 0.7, 0.4],
  high: [30, 8, 2.5, 1.1, 0.5, 0.2],
};
export const multipliers = (risk: Risk): number[] => {
  const h = HALF[risk];
  return [...h.slice(0, 5), h[5], ...h.slice(0, 5).reverse()];
};

/** One drop: a left(0)/right(1) choice per row. The landing bucket is how many rights. */
export function drop(rand: (n: number) => number = randInt): number[] {
  return Array.from({ length: ROWS }, () => rand(2));
}
export const bucketOf = (path: number[]) => path.reduce((a, b) => a + b, 0);
export const payout = (bet: number, risk: Risk, bucket: number) => Math.floor(bet * multipliers(risk)[bucket]);

const choose = (n: number, k: number) => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
/** Exact return to player for a bet size. */
export function rtp(risk: Risk, bet: number): number {
  let back = 0;
  for (let k = 0; k <= ROWS; k++) back += (choose(ROWS, k) / 2 ** ROWS) * payout(bet, risk, k);
  return back / bet;
}
