import type { Card } from "./cards";

export type Side = "player" | "banker" | "tie";
export const BACC_BETS = [20, 40, 100, 200];

/** Card value in baccarat: ace 1, 2-9 face value, ten and face cards 0. */
export const cardValue = (c: Card): number => (c.r === 14 ? 1 : c.r >= 10 ? 0 : c.r);
export const total = (hand: Card[]): number => hand.reduce((a, c) => a + cardValue(c), 0) % 10;

export type Round = { player: Card[]; banker: Card[]; pt: number; bt: number; winner: Side };

/** Deal one coup from the shoe using the standard third-card rules. Takes cards off the end of `shoe`. */
export function dealRound(shoe: Card[]): Round {
  const draw = () => shoe.pop() as Card;
  const player = [draw(), draw()];
  const banker = [draw(), draw()];
  let pt = total(player);
  let bt = total(banker);
  if (pt < 8 && bt < 8) {
    let p3: number | null = null;
    if (pt <= 5) {
      const c = draw();
      player.push(c);
      p3 = cardValue(c);
      pt = total(player);
    }
    let bankerDraws: boolean;
    if (p3 === null) bankerDraws = bt <= 5;
    else if (bt <= 2) bankerDraws = true;
    else if (bt === 3) bankerDraws = p3 !== 8;
    else if (bt === 4) bankerDraws = p3 >= 2 && p3 <= 7;
    else if (bt === 5) bankerDraws = p3 >= 4 && p3 <= 7;
    else if (bt === 6) bankerDraws = p3 === 6 || p3 === 7;
    else bankerDraws = false;
    if (bankerDraws) {
      banker.push(draw());
      bt = total(banker);
    }
  }
  return { player, banker, pt, bt, winner: pt > bt ? "player" : bt > pt ? "banker" : "tie" };
}

/** Chips returned (not counting the stake). Player 1:1, banker 0.95:1, tie 8:1; a tie pushes player and banker bets. */
export function payout(side: Side, winner: Side, bet: number): number {
  if (winner === "tie") return side === "tie" ? bet * 9 : bet;
  if (side !== winner) return 0;
  return side === "player" ? bet * 2 : Math.floor(bet * 1.95);
}
