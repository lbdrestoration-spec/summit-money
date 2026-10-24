import type { Card } from "./cards";
import { value } from "./blackjack-logic";

export type Move = "hit" | "stand" | "double" | "split";

/** Standard multi-deck basic strategy. `up` is the dealer's up card rank (2..14). */
export function advise(hand: Card[], up: number, canDouble: boolean, canSplit: boolean): { move: Move; why: string } {
  const d = up === 14 ? 11 : Math.min(up, 10);
  const { total, soft } = value(hand);
  const pairRank = hand.length === 2 && hand[0].r === hand[1].r ? hand[0].r : 0;
  const pv = pairRank === 14 ? 11 : Math.min(pairRank, 10);
  if (canSplit && pairRank) {
    if (pv === 11 || pv === 8) return { move: "split", why: pv === 11 ? "Always split aces." : "Always split eights." };
    if (pv === 9 && d !== 7 && d <= 9) return { move: "split", why: "Split nines against a 2 to 9, except 7." };
    if (pv === 7 && d <= 7) return { move: "split", why: "Split sevens against a 2 to 7." };
    if (pv === 6 && d <= 6) return { move: "split", why: "Split sixes against a weak 2 to 6." };
    if ((pv === 3 || pv === 2) && d <= 7 && d >= 2) return { move: "split", why: "Split small pairs against a 2 to 7." };
    if (pv === 4 && (d === 5 || d === 6)) return { move: "split", why: "Split fours only against a 5 or 6." };
  }
  const dbl = (why: string) => (canDouble ? { move: "double" as Move, why } : null);
  if (soft && total <= 21) {
    if (total >= 19) return { move: "stand", why: "Soft 19 or better stands." };
    if (total === 18) {
      if (d <= 6) return dbl("Soft 18 doubles against a weak dealer.") ?? { move: "stand", why: "Soft 18 stands against a weak dealer." };
      if (d <= 8) return { move: "stand", why: "Soft 18 stands against a 7 or 8." };
      return { move: "hit", why: "Soft 18 hits against a 9, 10 or ace." };
    }
    if (total === 17 && d >= 3 && d <= 6) return dbl("Soft 17 doubles against a 3 to 6.") ?? { move: "hit", why: "Soft 17 hits." };
    if ((total === 15 || total === 16) && d >= 4 && d <= 6) return dbl("Soft 15 or 16 doubles against a 4 to 6.") ?? { move: "hit", why: "Soft hand hits." };
    if ((total === 13 || total === 14) && d >= 5 && d <= 6) return dbl("Soft 13 or 14 doubles against a 5 or 6.") ?? { move: "hit", why: "Soft hand hits." };
    return { move: "hit", why: "You can't bust on a soft hand, so take a card." };
  }
  if (total >= 17) return { move: "stand", why: "Hard 17 or more stands." };
  if (total >= 13) return d <= 6 ? { move: "stand", why: "The dealer is weak and likely to bust. Stand." } : { move: "hit", why: "The dealer is strong. You have to take a card." };
  if (total === 12) return d >= 4 && d <= 6 ? { move: "stand", why: "Dealer shows a 4 to 6 and often busts. Stand." } : { move: "hit", why: "Hit a 12 unless the dealer shows a 4 to 6." };
  if (total === 11) return dbl("11 is the best doubling hand.") ?? { move: "hit", why: "Hit 11." };
  if (total === 10) return d <= 9 ? (dbl("Double 10 against anything but a 10 or ace.") ?? { move: "hit", why: "Hit 10." }) : { move: "hit", why: "Hit 10 against a 10 or ace." };
  if (total === 9) return d >= 3 && d <= 6 ? (dbl("Double 9 against a 3 to 6.") ?? { move: "hit", why: "Hit 9." }) : { move: "hit", why: "Hit 9." };
  return { move: "hit", why: "Small totals can't bust. Hit." };
}
