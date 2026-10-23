import { useId, useState } from "react";
import { money, type SeriesPoint } from "./calc";

/** Stock-style area chart of total saved this year */
export function StockChart({ series }: { series: SeriesPoint[] }) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 340;
  const H = 150;
  const pad = { l: 6, r: 6, t: 12, b: 18 };
  const values = series.map((p) => p.value);
  const max = Math.max(1, ...values);
  const x = (i: number) => pad.l + (series.length <= 1 ? 0 : (i / (series.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)} ${H - pad.b} L${x(0).toFixed(1)} ${H - pad.b} Z`;
  const last = series[series.length - 1];
  const up = values.length > 1 && last.value > values[0];
  const at = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };
  const hp = hover === null ? null : series[hover];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full touch-pan-y"
      role="img"
      aria-label={`Total saved this year: ${money(last?.value ?? 0)}`}
      onPointerMove={series.length > 1 ? at : undefined}
      onPointerDown={series.length > 1 ? at : undefined}
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-cc-lime)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-cc-lime)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + g * (H - pad.t - pad.b)} y2={pad.t + g * (H - pad.t - pad.b)} stroke="var(--color-cc-line)" strokeDasharray="2 5" />
      ))}
      {series.length > 1 && <path d={area} fill={`url(#${id})`} />}
      {series.length > 1 && <path d={line} fill="none" stroke={up ? "var(--color-cc-lime)" : "var(--color-cc-aqua)"} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {hp && hover !== null && (
        <g>
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--color-cc-snow)" strokeOpacity="0.5" strokeDasharray="3 3" />
          <circle cx={x(hover)} cy={y(hp.value)} r="5" fill="var(--color-cc-snow)" />
          <text x={Math.min(Math.max(x(hover), 50), W - 50)} y={pad.t + 2} textAnchor="middle" fontSize="11" fill="var(--color-cc-snow)" fontFamily="var(--font-mono)">
            {money(hp.value)} · {hp.date.slice(5)}
          </text>
        </g>
      )}
      {last && <circle cx={x(series.length - 1)} cy={y(last.value)} r="4.5" fill="var(--color-cc-lime)" />}
      <text x={pad.l} y={H - 3} fontSize="9" fill="var(--color-cc-muted)" fontFamily="var(--font-mono)">JAN</text>
      <text x={W - pad.r} y={H - 3} fontSize="9" textAnchor="end" fill="var(--color-cc-muted)" fontFamily="var(--font-mono)">TODAY</text>
    </svg>
  );
}

/** Seven-bar spending chart for the week */
export function WeekBars({ days }: { days: { date: string; spent: number; logged: boolean }[] }) {
  const max = Math.max(1, ...days.map((d) => d.spent));
  const names = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="flex h-28 items-end gap-2">
      {days.map((d, i) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-20 w-full items-end">
            <div
              className={`w-full rounded-t ${d.spent > 0 ? "bg-cc-orange" : d.logged ? "bg-cc-lime/60" : "bg-cc-line/50"}`}
              style={{ height: `${Math.max(6, (d.spent / max) * 100)}%` }}
              title={`${d.date}: ${money(d.spent)}`}
            />
          </div>
          <span className="font-mono text-[10px] text-cc-muted">{names[i]}</span>
        </div>
      ))}
    </div>
  );
}
