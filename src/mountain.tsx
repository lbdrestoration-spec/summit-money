import { useMemo } from "react";

/** Falling snow behind everything. Pure CSS animation, hidden for reduced-motion. */
export function Scene() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 9301 + n * 49297) * 233280;
          return x - Math.floor(x);
        };
        const size = 1.5 + r(1) * 2.5;
        return {
          left: `${r(2) * 100}%`,
          size,
          opacity: 0.2 + r(3) * 0.45,
          dur: 9 + r(4) * 12,
          delay: -r(5) * 20,
          drift: (r(6) - 0.5) * 60,
        };
      }),
    [],
  );
  return (
    <div className="scene" aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="flake"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
            ["--drift" as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/** A short burst of snow when money goes into savings. Hidden for reduced-motion. */
export function Burst() {
  const bits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.2;
        const d = 90 + (i % 5) * 38;
        return { x: Math.cos(a) * d, y: Math.sin(a) * d - 60, s: 3 + (i % 4) * 1.5, delay: (i % 6) * 20 };
      }),
    [],
  );
  return (
    <div className="burst pointer-events-none fixed left-1/2 top-[38%] z-10" aria-hidden="true">
      {bits.map((b, i) => (
        <span key={i} className="burst-bit" style={{ width: b.s, height: b.s, animationDelay: `${b.delay}ms`, ["--x" as string]: `${b.x}px`, ["--y" as string]: `${b.y}px` }} />
      ))}
    </div>
  );
}
