export const BOARD = 40;
export const DRAWN = 10;
export const MAX_PICKS = 5;
export const KENO_BETS = [10, 20, 50, 100];

/** Multiplier of the bet by number of picks, then by hits. Missing hits pay nothing. */
export const PAYS: Record<number, Record<number, number>> = {
  1: { 1: 3.7 },
  2: { 2: 16 },
  3: { 2: 2, 3: 55 },
  4: { 2: 1.5, 3: 8, 4: 130 },
  5: { 2: 1, 3: 4, 4: 20, 5: 400 },
};

/** Draw DRAWN distinct numbers from 1..BOARD using rng in [0, 1). */
export function draw(rng: () => number): Set<number> {
  const nums = Array.from({ length: BOARD }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return new Set(nums.slice(0, DRAWN));
}

export const hits = (picks: number[], drawn: Set<number>): number => picks.filter((p) => drawn.has(p)).length;

export function payout(picks: number[], drawn: Set<number>, bet: number): number {
  const k = hits(picks, drawn);
  const m = PAYS[picks.length]?.[k] ?? 0;
  return Math.floor(bet * m);
}

const choose = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
};

/** Exact return to player for a number of picks, from the hypergeometric distribution. */
export function rtp(nPicks: number): number {
  let total = 0;
  for (const [k, m] of Object.entries(PAYS[nPicks] ?? {})) {
    const p = (choose(DRAWN, Number(k)) * choose(BOARD - DRAWN, nPicks - Number(k))) / choose(BOARD, nPicks);
    total += p * m;
  }
  return total;
}
