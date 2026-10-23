import { colorOf } from "./roulette-logic";

/** European wheel order, clockwise from the top */
export const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const STEP = 360 / ORDER.length;
export const angleFor = (n: number) => -ORDER.indexOf(n) * STEP;

const fill = { red: "#c8415a", black: "#0b1424", green: "#5fb04a" } as const;

function wedge(i: number, r0: number, r1: number) {
  const a0 = ((i - 0.5) * STEP - 90) * (Math.PI / 180);
  const a1 = ((i + 0.5) * STEP - 90) * (Math.PI / 180);
  const p = (r: number, a: number) => `${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

/** Spinning wheel. `rot` is a growing angle so the CSS transition always turns forward. */
export function Wheel({ rot, spinning, shown }: { rot: number; spinning: boolean; shown: number | null }) {
  const c = shown === null ? null : colorOf(shown);
  return (
    <div className="relative h-28 w-28 shrink-0" role="img" aria-label={shown === null ? "Roulette wheel" : `Roulette wheel, ball on ${shown}`}>
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full"
        style={{ transform: `rotate(${rot}deg)`, transition: spinning ? "transform 2s cubic-bezier(0.12, 0.7, 0.2, 1)" : "none" }}
      >
        <circle cx="60" cy="60" r="59" fill="#3a2a1a" stroke="#c9a15a" strokeWidth="1.5" />
        {ORDER.map((n, i) => (
          <path key={n} d={wedge(i, 30, 54)} fill={fill[colorOf(n)]} stroke="#c9a15a" strokeWidth="0.3" />
        ))}
        {ORDER.map((n, i) => (
          <text
            key={`t${n}`}
            x="60"
            y="13"
            fontSize="5"
            fontWeight="700"
            textAnchor="middle"
            fill="#f1f6fb"
            transform={`rotate(${i * STEP} 60 60)`}
          >
            {n}
          </text>
        ))}
        <circle cx="60" cy="60" r="29" fill="#1a2a3f" stroke="#c9a15a" strokeWidth="1" />
      </svg>
      {/* ball marker at the top */}
      <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-0.5 rounded-full bg-cc-snow shadow-[0_0_6px_2px_rgba(241,246,251,0.7)]" aria-hidden="true" />
      <div
        className={`absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full border font-cc text-2xl font-bold ${
          c === "red" ? "border-cc-pink bg-cc-pink/80 text-cc-snow" : c === "green" ? "border-cc-lime bg-cc-lime text-cc-night" : "border-cc-line bg-cc-night text-cc-snow"
        }`}
      >
        {shown ?? "?"}
      </div>
    </div>
  );
}
