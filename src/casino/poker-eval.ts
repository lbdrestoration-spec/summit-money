import type { Card } from "./cards";

export const CAT_NAMES = [
  "High card",
  "a Pair",
  "Two pair",
  "Three of a kind",
  "a Straight",
  "a Flush",
  "a Full house",
  "Four of a kind",
  "a Straight flush",
] as const;

const B = 15;

/** Score exactly five cards. Higher is better. category * 15^5 + packed kickers. */
export function eval5(c: Card[]): number {
  const ranks = c.map((x) => x.r).sort((a, b) => b - a);
  const flush = c.every((x) => x.s === c[0].s);
  const uniq = [...new Set(ranks)];
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5; // wheel
  }
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const pattern = groups.map((g) => g[1]).join("");
  let cat = 0;
  if (straightHigh && flush) cat = 8;
  else if (pattern === "41") cat = 7;
  else if (pattern === "32") cat = 6;
  else if (flush) cat = 5;
  else if (straightHigh) cat = 4;
  else if (pattern === "311") cat = 3;
  else if (pattern === "221") cat = 2;
  else if (pattern === "2111") cat = 1;
  const kick = straightHigh ? [straightHigh] : groups.map((g) => g[0]);
  let score = cat;
  for (let i = 0; i < 5; i++) score = score * B + (kick[i] ?? 0);
  return score;
}

/** Best five-card score from 5 to 7 cards */
export function best7(cards: Card[]): number {
  const n = cards.length;
  let best = -1;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const s = eval5([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (s > best) best = s;
          }
  return best;
}

export const category = (score: number) => Math.floor(score / B ** 5);
export const handName = (score: number) => CAT_NAMES[category(score)];
