/** European roulette: one zero. */
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const colorOf = (n: number) => (n === 0 ? "green" : RED.has(n) ? "red" : "black");

/** Bet keys: "n:17", "red", "black", "odd", "even", "low", "high", "d1", "d2", "d3" */
export function multiplier(key: string, n: number): number {
  if (key.startsWith("n:")) return Number(key.slice(2)) === n ? 35 : 0;
  if (n === 0) return 0;
  switch (key) {
    case "red":
      return RED.has(n) ? 1 : 0;
    case "black":
      return !RED.has(n) ? 1 : 0;
    case "odd":
      return n % 2 === 1 ? 1 : 0;
    case "even":
      return n % 2 === 0 ? 1 : 0;
    case "low":
      return n <= 18 ? 1 : 0;
    case "high":
      return n >= 19 ? 1 : 0;
    case "d1":
      return n <= 12 ? 2 : 0;
    case "d2":
      return n >= 13 && n <= 24 ? 2 : 0;
    case "d3":
      return n >= 25 ? 2 : 0;
  }
  return 0;
}

/** Chips returned (stake included on wins) for a set of bets */
export function payout(bets: Record<string, number>, n: number): number {
  let back = 0;
  for (const [k, stake] of Object.entries(bets)) {
    const m = multiplier(k, n);
    if (m > 0) back += stake * (m + 1);
  }
  return back;
}
