export const SIZE = 25;
export const MINE_CHOICES = [1, 3, 5];
export const MINE_BETS = [5, 10, 25, 50];
export const EDGE = 0.97; // house keeps 3% of the fair multiplier

/** Fair chance that `safe` reveals in a row all miss the `mines` slides. */
export function surviveChance(mines: number, safe: number): number {
  let p = 1;
  for (let i = 0; i < safe; i++) p *= (SIZE - mines - i) / (SIZE - i);
  return p;
}

/** Multiplier after `safe` safe reveals. */
export const multiplier = (mines: number, safe: number): number => (safe === 0 ? 1 : EDGE / surviveChance(mines, safe));

export const cashValue = (bet: number, mines: number, safe: number): number => Math.floor(bet * multiplier(mines, safe));

/** Place `mines` mines on a 5x5 board using rng in [0, 1). Returns a set of tile indexes. */
export function placeMines(mines: number, rng: () => number): Set<number> {
  const tiles = Array.from({ length: SIZE }, (_, i) => i);
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return new Set(tiles.slice(0, mines));
}
