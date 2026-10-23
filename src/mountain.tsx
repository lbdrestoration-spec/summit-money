import { useMemo } from "react";

/** Falling snow behind everything. Pure CSS animation, hidden for reduced-motion. */
export function Scene() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 9301 + n * 49297) * 233280;
          return x - Math.floor(x);
        };
        const size = 2 + r(1) * 3;
        return {
          left: `${r(2) * 100}%`,
          size,
          opacity: 0.25 + r(3) * 0.5,
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

/** A row of pine trees as one path (stacked triangles on a trunk). */
function pines(count: number, base: number, minH: number, maxH: number, seed: number, width = 400) {
  let d = "";
  for (let i = 0; i < count; i++) {
    const r = (n: number) => {
      const x = Math.sin((i + 1) * 12.9898 + n * 78.233 + seed * 37.719) * 43758.5453;
      return x - Math.floor(x);
    };
    const x = (i + r(1) * 0.8) * (width / count);
    const h = minH + r(2) * (maxH - minH);
    const w = h * 0.38;
    const tiers = 3;
    // trunk
    d += `M${x - 1.2} ${base} L${x - 1.2} ${base - h * 0.14} L${x + 1.2} ${base - h * 0.14} L${x + 1.2} ${base} Z `;
    for (let t = 0; t < tiers; t++) {
      const top = base - h + (t * h * 0.24);
      const bottom = base - h * 0.12 - (tiers - 1 - t) * h * 0.2;
      const half = w * (0.55 + t * 0.22);
      d += `M${x} ${top} L${x + half} ${bottom} L${x - half} ${bottom} Z `;
    }
  }
  return d;
}

/** Layered ridge + pine forest for the top of Home. */
export function ForestRidge() {
  const far = useMemo(() => pines(26, 110, 14, 26, 1), []);
  const mid = useMemo(() => pines(18, 112, 22, 40, 2), []);
  const near = useMemo(() => pines(11, 116, 34, 62, 3), []);
  return (
    <svg viewBox="0 0 400 120" className="absolute inset-x-0 bottom-0 w-full" aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fd8d0" stopOpacity="0" />
          <stop offset="1" stopColor="#6fd8d0" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width="400" height="120" fill="url(#glow)" />
      <circle cx="318" cy="26" r="9" fill="#eef6f1" opacity="0.9" />
      <circle cx="318" cy="26" r="20" fill="#eef6f1" opacity="0.08" />
      {/* Big Mountain ridge */}
      <path d="M0 110 L0 78 L48 52 L84 70 L140 28 L196 66 L250 40 L310 72 L360 50 L400 70 L400 110 Z" fill="#1c3a30" />
      <path d="M140 28 L158 49 L148 46 L140 58 L131 45 L121 49 Z" fill="#eef6f1" opacity="0.92" />
      <path d="M250 40 L264 58 L255 56 L250 66 L243 55 L235 58 Z" fill="#eef6f1" opacity="0.85" />
      <path d="M48 52 L60 66 L52 64 L48 72 L42 63 L35 66 Z" fill="#eef6f1" opacity="0.8" />
      <path d={far} fill="#15302a" />
      <path d={mid} fill="#0f241f" />
      <path d={near} fill="#091712" />
      <rect y="112" width="400" height="8" fill="#091712" />
    </svg>
  );
}
