/** Gondola Run: one-button snowboard runner. Pure logic so it can be tested without a canvas. */
export const W = 360;
export const H = 180;
export const GROUND = 36; // px from the bottom to the snow line
export const PX = 56; // rider x
export const RIDER_W = 18;
export const RIDER_H = 26;
const GRAVITY = 1800;
const JUMP = 640;
export const MAX_SPEED = 420;

export type Obstacle = { kind: "tree" | "flake"; x: number; w: number; h: number; y: number; taken?: boolean };
export type Run = {
  y: number; // height above the snow
  vy: number;
  dist: number;
  speed: number;
  flakes: number;
  obs: Obstacle[];
  gap: number; // distance until the next spawn
  over: boolean;
};

export const newRun = (): Run => ({ y: 0, vy: 0, dist: 0, speed: 220, flakes: 0, obs: [], gap: 260, over: false });
export const score = (r: Run) => Math.floor(r.dist / 10) + r.flakes * 10;
/** Chips for a finished run. Capped so the game can't be farmed. */
export const RUN_CHIP_CAP = 60;
export const RUNS_PAID_PER_DAY = 3;
export const chipsFor = (sc: number) => Math.min(RUN_CHIP_CAP, Math.floor(sc / 8));

export function jump(r: Run): Run {
  return r.over || r.y > 0 ? r : { ...r, vy: JUMP };
}

/** Advance by dt seconds. `rnd` returns [0,1). */
export function step(r: Run, dt: number, rnd: () => number): Run {
  if (r.over) return r;
  const n: Run = { ...r, obs: r.obs.map((o) => ({ ...o })) };
  n.vy -= GRAVITY * dt;
  n.y += n.vy * dt;
  if (n.y <= 0) {
    n.y = 0;
    n.vy = Math.max(0, n.vy);
  }
  const dx = n.speed * dt;
  n.dist += dx;
  n.speed = Math.min(MAX_SPEED, n.speed + 6 * dt);
  for (const o of n.obs) o.x -= dx;
  n.gap -= dx;
  if (n.gap <= 0) {
    if (rnd() < 0.72) {
      n.obs.push({ kind: "tree", x: W + 20, w: 16 + Math.floor(rnd() * 10), h: 28 + Math.floor(rnd() * 20), y: 0 });
    } else {
      const y = 50 + Math.floor(rnd() * 40);
      for (let i = 0; i < 3; i++) n.obs.push({ kind: "flake", x: W + 20 + i * 28, w: 12, h: 12, y });
    }
    n.gap = n.speed * 0.85 + rnd() * 180 + 100;
  }
  for (const o of n.obs) {
    const overlapX = PX + RIDER_W > o.x + 3 && PX < o.x + o.w - 3;
    if (!overlapX) continue;
    if (o.kind === "tree") {
      if (n.y < o.h - 6) n.over = true;
    } else if (!o.taken && n.y + RIDER_H > o.y - 6 && n.y < o.y + o.h + 6) {
      o.taken = true;
      n.flakes += 1;
    }
  }
  n.obs = n.obs.filter((o) => o.x + o.w > -10 && !o.taken);
  return n;
}
