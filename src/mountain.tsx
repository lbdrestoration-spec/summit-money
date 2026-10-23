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
