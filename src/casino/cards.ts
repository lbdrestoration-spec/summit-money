import { shuffle } from "./rng";

export type Card = { r: number; s: number }; // r: 2..14 (14 = ace), s: 0..3
export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const isRed = (c: Card) => c.s === 1 || c.s === 2;
export const rankLabel = (r: number) => (r === 14 ? "A" : r === 13 ? "K" : r === 12 ? "Q" : r === 11 ? "J" : String(r));

/** A freshly shuffled shoe of `decks` 52-card decks */
export function makeShoe(decks = 1): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d++) for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) cards.push({ r, s });
  return shuffle(cards);
}
