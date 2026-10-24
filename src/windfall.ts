import { bucketSaved } from "./calc";
import type { State } from "./types";

export type Slice = { id: string; name: string; amount: number };

/** Split a windfall across open goals in proportion to what each still needs, in whole dollars, never past a goal's target. */
export function splitWindfall(state: State, amount: number): { slices: Slice[]; left: number } {
  const total = Math.floor(amount);
  const open = state.buckets
    .filter((b) => typeof b.target === "number" && (b.target as number) > bucketSaved(b))
    .map((b) => ({ id: b.id, name: b.name, need: Math.ceil((b.target as number) - bucketSaved(b)) }));
  const needAll = open.reduce((a, b) => a + b.need, 0);
  if (!(total > 0) || needAll <= 0) return { slices: [], left: Math.max(0, total) };
  const give = Math.min(total, needAll);
  const raw = open.map((b) => ({ ...b, exact: (give * b.need) / needAll }));
  const out = raw.map((b) => ({ ...b, amount: Math.min(b.need, Math.floor(b.exact)) }));
  let rest = give - out.reduce((a, b) => a + b.amount, 0);
  const order = [...out].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)));
  for (const o of order) {
    if (rest <= 0) break;
    if (o.amount < o.need) {
      o.amount += 1;
      rest -= 1;
    }
  }
  const slices = out.filter((o) => o.amount > 0).map((o) => ({ id: o.id, name: o.name, amount: o.amount }));
  return { slices, left: total - slices.reduce((a, s) => a + s.amount, 0) };
}
