import type { Card } from "./cards";

export function value(hand: Card[]) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.r === 14) {
      aces++;
      total += 11;
    } else total += Math.min(c.r, 10);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export const isBlackjack = (h: Card[]) => h.length === 2 && value(h).total === 21;

/** Dealer draws to 17 and stands on every 17, including soft 17. */
export function dealerPlay(shoe: Card[], dealer: Card[]): Card[] {
  const d = [...dealer];
  while (value(d).total < 17) d.push(shoe.pop() as Card);
  return d;
}

/** Chips returned to the player (stake included) and a short message. */
/** `afterSplit`: a two-card 21 on a split hand is just 21, not a blackjack. */
export function settle(player: Card[], dealer: Card[], stake: number, afterSplit = false): { back: number; msg: string } {
  const p = value(player).total;
  const d = value(dealer).total;
  const pBJ = !afterSplit && isBlackjack(player);
  const dBJ = isBlackjack(dealer);
  if (pBJ && dBJ) return { back: stake, msg: "Both have blackjack. Push." };
  if (pBJ) return { back: stake + Math.floor(stake * 1.5), msg: "Blackjack! Pays 3 to 2." };
  if (dBJ) return { back: 0, msg: "Dealer has blackjack." };
  if (p > 21) return { back: 0, msg: "Bust." };
  if (d > 21) return { back: stake * 2, msg: "Dealer busts. You win!" };
  if (p > d) return { back: stake * 2, msg: "You win!" };
  if (p === d) return { back: stake, msg: "Push." };
  return { back: 0, msg: "Dealer wins." };
}

/** Two cards of the same value (any two ten-value cards may be split). */
export const canSplitPair = (h: Card[]) => h.length === 2 && Math.min(h[0].r, 10) === Math.min(h[1].r, 10);
