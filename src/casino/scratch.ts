/** Prizes on the daily scratch card, with how likely each is (out of 100). A zero means a losing ticket. */
export const PRIZES: { chips: number; w: number; sym: string }[] = [
  { chips: 0, w: 45, sym: "" },
  { chips: 5, w: 22, sym: "❄️" },
  { chips: 10, w: 15, sym: "🌲" },
  { chips: 20, w: 9, sym: "🏂" },
  { chips: 40, w: 5, sym: "⛰️" },
  { chips: 100, w: 3, sym: "⭐" },
  { chips: 250, w: 1, sym: "💰" },
];
export const SCRATCH_SYMS = ["❄️", "🌲", "🏂", "⛰️", "⭐", "💰"];
export const VALID_PRIZES: number[] = PRIZES.map((p) => p.chips);

/** Pick a prize using r in [0, 1). */
export function rollPrize(r: number): number {
  let t = r * 100;
  for (const p of PRIZES) {
    t -= p.w;
    if (t < 0) return p.chips;
  }
  return 0;
}

/** Average chips per ticket. */
export const expected = () => PRIZES.reduce((a, p) => a + (p.chips * p.w) / 100, 0);

/** Nine tiles for a prize. Three of the prize's symbol means a win; otherwise no symbol shows three times. */
export function ticket(prize: number, rng: () => number): string[] {
  const shuffle = <T,>(a: T[]) => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const win = PRIZES.find((p) => p.chips === prize && p.chips > 0);
  const tiles: string[] = [];
  const counts: Record<string, number> = {};
  const add = (s: string) => {
    tiles.push(s);
    counts[s] = (counts[s] ?? 0) + 1;
  };
  if (win) for (let i = 0; i < 3; i++) add(win.sym);
  while (tiles.length < 9) {
    const s = SCRATCH_SYMS[Math.floor(rng() * SCRATCH_SYMS.length)];
    if ((counts[s] ?? 0) < 2) add(s);
  }
  return shuffle(tiles);
}

/** What a ticket pays, read straight off the tiles. */
export function readTicket(tiles: string[]): number {
  for (const p of PRIZES) if (p.chips > 0 && tiles.filter((t) => t === p.sym).length >= 3) return p.chips;
  return 0;
}
