import { randInt } from "./rng";

/** 24 slots around the wheel. Most are small or empty; one is 8x. */
export const SEGMENTS = [8, 0, 1, 0, 1.5, 0, 0.5, 0, 2, 0, 1, 0, 1.5, 0, 0.5, 0, 1.5, 0, 0.5, 0, 4, 0, 0.5, 0];
export const WHEEL_BETS = [10, 20, 50, 100];
export const spin = (rand: (n: number) => number = randInt) => rand(SEGMENTS.length);
export const payout = (bet: number, seg: number) => Math.floor(bet * SEGMENTS[seg]);
/** Exact return to player for a bet size. */
export const rtp = (bet: number) => SEGMENTS.reduce((a, _, i) => a + payout(bet, i), 0) / (SEGMENTS.length * bet);
