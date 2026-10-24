import { makeShoe, type Card } from "./cards";
import { best7, category, handName } from "./poker-eval";

export type Verdict = "A" | "B" | "split";
export type Deal = { board: Card[]; a: Card[]; b: Card[]; verdict: Verdict; aName: string; bName: string };

/** Who wins on this board: hand A, hand B, or a split. */
export function judge(board: Card[], a: Card[], b: Card[]): Verdict {
  const sa = best7([...board, ...a]);
  const sb = best7([...board, ...b]);
  return sa > sb ? "A" : sb > sa ? "B" : "split";
}

/** A fresh practice deal: a five-card board and two two-card hands. Skips boring all-high-card deals. */
export function newDeal(deck: () => Card[] = () => makeShoe(1)): Deal {
  for (let tries = 0; ; tries++) {
    const d = deck();
    const board = d.slice(0, 5);
    const a = d.slice(5, 7);
    const b = d.slice(7, 9);
    const sa = best7([...board, ...a]);
    const sb = best7([...board, ...b]);
    if (tries < 30 && Math.max(category(sa), category(sb)) < 1) continue;
    return { board, a, b, verdict: sa > sb ? "A" : sb > sa ? "B" : "split", aName: handName(sa), bName: handName(sb) };
  }
}
