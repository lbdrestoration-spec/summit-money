import type { Card } from "./cards";

export const EDGE = 0.97; // house keeps 3% of the fair payout on each guess
export const HILO_BETS = [5, 10, 25, 50];

/** Chance the next card is higher or lower than `cur`, from the cards still in the deck. Ties lose. */
export function odds(cur: Card, deck: Card[]) {
  const n = deck.length;
  if (n === 0) return { higher: 0, lower: 0 };
  return { higher: deck.filter((c) => c.r > cur.r).length / n, lower: deck.filter((c) => c.r < cur.r).length / n };
}

/** Multiplier added by one correct guess. */
export const stepMult = (p: number) => (p > 0 ? EDGE / p : 0);

export const cashValue = (bet: number, mult: number) => Math.floor(bet * mult);
