export const DICE_BETS = [5, 10, 25, 50];
export const EDGE = 0.97;
export const MIN_T = 5;
export const MAX_T = 95;
export type Dir = "under" | "over";

/** Chance to win, as a fraction. The roll is a whole number 0 to 99. Under 50 wins on 0..49; over 50 wins on 51..99. */
export function chance(dir: Dir, t: number): number {
  return dir === "under" ? t / 100 : (99 - t) / 100;
}

export const multiplier = (dir: Dir, t: number): number => EDGE / chance(dir, t);

export function wins(roll: number, dir: Dir, t: number): boolean {
  return dir === "under" ? roll < t : roll > t;
}

/** Chips returned (not counting the stake) for a roll. */
export function payout(roll: number, dir: Dir, t: number, bet: number): number {
  return wins(roll, dir, t) ? Math.floor(bet * multiplier(dir, t)) : 0;
}

export const clampTarget = (t: number): number => Math.max(MIN_T, Math.min(MAX_T, Math.round(t)));
