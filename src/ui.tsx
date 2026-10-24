import type { ReactNode } from "react";

export const label = "font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted";
export const input =
  "w-full min-w-0 rounded-lg border border-cc-line bg-cc-night/70 px-3 py-2.5 text-cc-snow placeholder:text-cc-muted/70 focus:border-cc-aqua/70 focus:outline-none";

type Tone = "orange" | "lime" | "aqua" | "violet" | "pink" | "gold";
export const toneText: Record<Tone, string> = {
  orange: "text-cc-orange",
  lime: "text-cc-lime",
  aqua: "text-cc-aqua",
  violet: "text-cc-violet",
  pink: "text-cc-pink",
  gold: "text-cc-gold",
};
export const toneBar: Record<Tone, string> = {
  orange: "bg-cc-orange",
  lime: "bg-cc-lime",
  aqua: "bg-cc-aqua",
  violet: "bg-cc-violet",
  pink: "bg-cc-pink",
  gold: "bg-cc-gold",
};
const toneBorder: Record<Tone, string> = {
  orange: "border-cc-orange/45",
  lime: "border-cc-lime/45",
  aqua: "border-cc-aqua/45",
  violet: "border-cc-violet/50",
  pink: "border-cc-pink/50",
  gold: "border-cc-gold/45",
};

export function Card({ children, tone, className = "", photo, tint }: { children: ReactNode; tone?: Tone; className?: string; photo?: string; tint?: string }) {
  const base = `rise relative overflow-hidden rounded-2xl border bg-cc-panel/70 backdrop-blur-md ${tone ? toneBorder[tone] : "border-cc-line"}`;
  if (!photo)
    return <section className={`${base} p-4 ${className}`}>{children}</section>;
  return (
    <section className={base}>
      <img src={photo} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55" loading="lazy" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cc-night/95 via-cc-night/65 to-cc-night/20" />
      {tint && <div className="pointer-events-none absolute inset-0" style={{ background: tint }} />}
      <div className={`relative p-4 ${className}`}>{children}</div>
    </section>
  );
}

/** Photo banner at the top of a screen */
export function PhotoHeader({ src, title, sub, video }: { src: string; title: string; sub?: string; video?: string }) {
  return (
    <div className="rise relative h-36 overflow-hidden rounded-2xl border border-cc-line">
      <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      {video && <video className="hero-video absolute inset-0 h-full w-full object-cover" src={video} poster={src} autoPlay muted loop playsInline preload="auto" aria-hidden="true" />}
      <div className="absolute inset-0 bg-gradient-to-t from-cc-night via-cc-night/40 to-transparent" />
      <div className="absolute inset-x-4 bottom-3">
        <h2 className="font-cc text-4xl font-bold uppercase leading-none tracking-wide text-cc-snow">{title}</h2>
        {sub && <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cc-aqua">{sub}</div>}
      </div>
    </div>
  );
}

export function Heading({ children, tone = "aqua" }: { children: ReactNode; tone?: Tone }) {
  return <h2 className={`font-cc text-2xl font-semibold uppercase tracking-wide ${toneText[tone]}`}>{children}</h2>;
}

export function Button({
  children,
  variant = "ghost",
  className = "",
  ...rest
}: { variant?: "primary" | "lime" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: "bg-cc-aqua text-cc-night active:bg-cc-snow",
    lime: "bg-cc-lime text-cc-night active:bg-cc-snow",
    ghost: "border border-cc-line bg-cc-night/40 text-cc-snow active:border-cc-aqua/60",
    danger: "border border-cc-pink/50 bg-cc-pink/10 text-cc-pink",
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Progress({ value, tone = "aqua", name = "Progress" }: { value: number; tone?: Tone; name?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-cc-night/80" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <div className={`h-full rounded-full ${toneBar[tone]} transition-[width] duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ title, value, tone = "snow", hint }: { title: string; value: string; tone?: Tone | "snow"; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className={label}>{title}</div>
      <div className={`font-cc text-3xl font-semibold leading-tight ${tone === "snow" ? "text-cc-snow" : toneText[tone]}`}>{value}</div>
      {hint && <div className="text-xs text-cc-muted">{hint}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-cc-line p-4 text-center text-sm text-cc-muted">{children}</p>;
}
