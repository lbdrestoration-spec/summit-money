import { useCallback, useEffect, useRef, useState } from "react";
import { iso, today } from "../calc";
import { buzz } from "../haptic";
import { play } from "../sound";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, label } from "../ui";
import { chipsFor, GROUND, H, jump, newRun, PX, RIDER_H, RIDER_W, RUNS_PAID_PER_DAY, score, step, W, type Run } from "./run-logic";

function draw(ctx: CanvasRenderingContext2D, r: Run) {
  // the sky drifts from day to dusk to night as you ride farther
  const phase = (r.dist / 4000) % 1;
  const SKIES: [string, string][] = [["#2a6fb0", "#bfe0f5"], ["#7a4a8a", "#f2a65a"], ["#0a1530", "#2a4a7a"], ["#2b4a78", "#e7a98a"]];
  const k = Math.floor(phase * SKIES.length);
  const [top, bot] = SKIES[k];
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // far ridge scrolls slowly
  ctx.fillStyle = "#dbe8f3";
  ctx.beginPath();
  ctx.moveTo(0, H - GROUND);
  const off = (r.dist * 0.15) % 120;
  for (let x = -120; x <= W + 120; x += 60) ctx.lineTo(x - off + 30, H - GROUND - 40 - ((x / 60) % 2 === 0 ? 24 : 0));
  ctx.lineTo(W + 120, H - GROUND);
  ctx.fill();
  // snow
  ctx.fillStyle = "#f1f6fb";
  ctx.fillRect(0, H - GROUND, W, GROUND);
  for (const o of r.obs) {
    const base = H - GROUND;
    if (o.kind === "tree") {
      ctx.fillStyle = "#3b2a1c";
      ctx.fillRect(o.x + o.w / 2 - 2, base - 6, 4, 6);
      ctx.fillStyle = "#1f5a3a";
      for (let i = 0; i < 3; i++) {
        const top = base - o.h + i * (o.h / 3.4);
        ctx.beginPath();
        ctx.moveTo(o.x + o.w / 2, top);
        ctx.lineTo(o.x + o.w + 2 - i, top + o.h / 2.2);
        ctx.lineTo(o.x - 2 + i, top + o.h / 2.2);
        ctx.fill();
      }
    } else if (o.kind === "rock") {
      ctx.fillStyle = "#6b7684";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, base - o.h / 2 + 2, o.w / 2 + 1, o.h / 2 + 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8d98a6";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2 - 2, base - o.h / 2, o.w / 3, o.h / 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#7de3ff";
      ctx.beginPath();
      ctx.arc(o.x + 6, base - o.y - 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // rider: board, body, head
  const by = H - GROUND - r.y;
  ctx.save();
  ctx.translate(PX + RIDER_W / 2, by);
  ctx.rotate(r.y > 0 ? -Math.min(0.5, r.vy / 1600) : 0);
  ctx.fillStyle = "#ff8a3d";
  ctx.fillRect(-14, -3, 28, 4);
  ctx.fillStyle = "#c9ff3d";
  ctx.fillRect(-5, -RIDER_H + 8, 10, RIDER_H - 11);
  ctx.fillStyle = "#f1c9a5";
  ctx.beginPath();
  ctx.arc(0, -RIDER_H + 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#16314f";
  ctx.fillRect(-5, -RIDER_H, 10, 4);
  ctx.restore();
}

/** Snowboard runner. Tap, click or press space to jump the pines and grab flakes. */
export function GondolaRun({ state, actions }: { state: State; actions: Actions }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const run = useRef<Run>(newRun());
  const raf = useRef(0);
  const [phase, setPhase] = useState<"idle" | "play" | "over">("idle");
  const [shown, setShown] = useState(0);
  const [last, setLast] = useState(0);
  const date = iso(today());
  const paidToday = state.runs.day === date ? state.runs.paid : 0;
  const chancesLeft = Math.max(0, RUNS_PAID_PER_DAY - paidToday);

  const frame = useCallback(
    (t0: number) => {
      let prev = t0;
      const loop = (t: number) => {
        const dt = Math.min(0.05, (t - prev) / 1000);
        prev = t;
        run.current = step(run.current, dt, Math.random);
        const c = cv.current?.getContext("2d");
        if (c) draw(c, run.current);
        setShown(score(run.current));
        if (run.current.over) {
          const sc = score(run.current);
          setLast(sc);
          setPhase("over");
          buzz([40, 30, 40]);
          play("tick");
          actions.finishRun(sc, iso(today()));
          return;
        }
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    },
    [actions],
  );

  const start = () => {
    run.current = newRun();
    setPhase("play");
    setShown(0);
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(frame);
  };
  const hop = useCallback(() => {
    run.current = jump(run.current);
  }, []);

  useEffect(() => {
    const c = cv.current?.getContext("2d");
    if (c) draw(c, run.current);
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space" && phase === "play") {
        e.preventDefault();
        hop();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phase, hop]);
  // stop the loop only when the game leaves the screen, not on every phase change
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className={label}>Gondola Run</div>
          <div className="font-cc text-4xl font-bold leading-none">{phase === "idle" ? state.runs.best : shown}</div>
        </div>
        <div className="text-right">
          <div className={label}>Best</div>
          <div className="font-cc text-2xl text-cc-gold">{Math.max(state.runs.best, phase === "play" ? 0 : last)}</div>
        </div>
      </div>
      <canvas
        ref={cv}
        width={W}
        height={H}
        role="img"
        aria-label="Snowboard run game canvas"
        className="w-full touch-none rounded-xl border border-cc-line bg-cc-night"
        style={{ aspectRatio: `${W} / ${H}` }}
        onPointerDown={() => phase === "play" && hop()}
      />
      {phase !== "play" && (state.runs.recent ?? []).length > 0 && (
        <div aria-label="Recent runs" role="group">
          <div className={label}>Last {(state.runs.recent ?? []).length} runs</div>
          <div className="mt-1 flex h-10 items-end gap-1">
            {(state.runs.recent ?? []).map((v, i) => (
              <div key={i} title={String(v)} className={`flex-1 rounded-t ${v === state.runs.best ? "bg-cc-gold" : "bg-cc-aqua/60"}`} style={{ height: `${Math.max(8, (v / Math.max(1, state.runs.best)) * 100)}%` }} />
            ))}
          </div>
        </div>
      )}
      {phase === "play" ? (
        <Button variant="lime" className="w-full" onPointerDown={hop}>
          Jump
        </Button>
      ) : (
        <>
          {phase === "over" && (
            <p className="text-sm" aria-live="polite">
              Wiped out at {last}. {chancesLeft < RUNS_PAID_PER_DAY && paidToday > 0 ? `${chipsFor(last) > 0 ? `+${chipsFor(last)} chips earned. ` : ""}` : ""}
            </p>
          )}
          <Button className="w-full" onClick={start}>
            {phase === "over" ? "Run again" : "Drop in"}
          </Button>
          <p className="text-xs text-cc-muted">
            Jump the pines and rocks, grab the blue flakes. The sky turns to dusk as you go. Score ÷ 8 in chips, up to 60. The first {RUNS_PAID_PER_DAY} runs each day pay. {chancesLeft} paid {chancesLeft === 1 ? "run" : "runs"} left today.
          </p>
        </>
      )}
    </div>
  );
}
