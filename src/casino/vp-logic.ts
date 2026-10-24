import type { Card } from "./cards";
import { category, eval5 } from "./poker-eval";

/** Jacks or Better pay table: multiplier of the bet. */
export const PAYS: { name: string; mult: number }[] = [
  { name: "Royal flush", mult: 250 },
  { name: "Straight flush", mult: 50 },
  { name: "Four of a kind", mult: 25 },
  { name: "Full house", mult: 9 },
  { name: "Flush", mult: 6 },
  { name: "Straight", mult: 4 },
  { name: "Three of a kind", mult: 3 },
  { name: "Two pair", mult: 2 },
  { name: "Jacks or better", mult: 1 },
];
export const BETS = [5, 10, 25, 50];

/** Rate a five-card hand. Returns null when it pays nothing. */
export function rate(h: Card[]): { name: string; mult: number } | null {
  const cat = category(eval5(h));
  const by = (n: string) => PAYS.find((p) => p.name === n) as { name: string; mult: number };
  if (cat === 8) {
    const low = Math.min(...h.map((c) => c.r));
    return low === 10 ? by("Royal flush") : by("Straight flush");
  }
  if (cat === 7) return by("Four of a kind");
  if (cat === 6) return by("Full house");
  if (cat === 5) return by("Flush");
  if (cat === 4) return by("Straight");
  if (cat === 3) return by("Three of a kind");
  if (cat === 2) return by("Two pair");
  if (cat === 1) {
    const counts = new Map<number, number>();
    for (const c of h) counts.set(c.r, (counts.get(c.r) ?? 0) + 1);
    const pairRank = [...counts.entries()].find(([, n]) => n === 2)?.[0] ?? 0;
    return pairRank >= 11 ? by("Jacks or better") : null;
  }
  return null;
}

/** Replace every card not held with the next ones from the deck. */
export function drawCards(hand: Card[], held: boolean[], deck: Card[]): { hand: Card[]; deck: Card[] } {
  const d = [...deck];
  return { hand: hand.map((c, i) => (held[i] ? c : (d.pop() as Card))), deck: d };
}
