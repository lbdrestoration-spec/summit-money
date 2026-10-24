import { useEffect, useState } from "react";
import { Card, Heading, label } from "../ui";

export type MountainReport = {
  at: number;
  temp: number;
  wind: number;
  gust: number;
  depthIn: number | null;
  days: { date: string; snowIn: number; hi: number; lo: number; gust: number }[];
  sunrise: string;
  sunset: string;
};
const KEY = "summit-money:mountain";
// Whitefish Mountain summit, about 6,800 ft
export const MOUNTAIN_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=48.48&longitude=-114.35&elevation=2078&current=temperature_2m,wind_speed_10m,wind_gusts_10m&hourly=snow_depth&daily=snowfall_sum,temperature_2m_max,temperature_2m_min,wind_gusts_10m_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FDenver&forecast_days=7";

/** Turns the raw API answer into what the card shows. Exported so it can be tested on its own. */
export function summarize(j: any, now = Date.now()): MountainReport {
  const d = j.daily;
  const times: string[] = j.hourly?.time ?? [];
  const depths: (number | null)[] = j.hourly?.snow_depth ?? [];
  // the current hour: last hourly stamp that is not after the API's own "current" time
  const cur = String(j.current?.time ?? "").slice(0, 13);
  let idx = times.findIndex((t) => t.slice(0, 13) === cur);
  if (idx < 0) idx = 0;
  const m = depths[idx];
  return {
    at: now,
    temp: Math.round(j.current.temperature_2m),
    wind: Math.round(j.current.wind_speed_10m),
    gust: Math.round(j.current.wind_gusts_10m),
    depthIn: typeof m === "number" ? Math.round((m / 0.0254) * 10) / 10 : null,
    days: d.time.map((t: string, i: number) => ({
      date: t,
      snowIn: Math.round((d.snowfall_sum[i] / 2.54) * 10) / 10,
      hi: Math.round(d.temperature_2m_max[i]),
      lo: Math.round(d.temperature_2m_min[i]),
      gust: Math.round(d.wind_gusts_10m_max[i]),
    })),
    sunrise: d.sunrise[0],
    sunset: d.sunset[0],
  };
}

/** A plain-English call on the next day or two. */
export function rideCall(r: MountainReport): { text: string; tone: "lime" | "aqua" | "orange" | "pink" } {
  const next = r.days.slice(0, 2).reduce((a, d) => a + d.snowIn, 0);
  const gust = Math.max(r.gust, r.days[0]?.gust ?? 0);
  if (gust >= 45) return { text: "Very windy up top. Lifts may hold. Check before you drive up.", tone: "pink" };
  if (next >= 6) return { text: `Powder day coming: ${next.toFixed(1)} in in the next two days.`, tone: "lime" };
  if (next >= 2) return { text: `A fresh ${next.toFixed(1)} in is on the way. Soft turns.`, tone: "aqua" };
  if ((r.depthIn ?? 0) < 12) return { text: "Thin base up top. Keep stacking, snow is the missing piece.", tone: "orange" };
  return { text: "Dry stretch. Groomers and base should hold up.", tone: "aqua" };
}

function cached(): MountainReport | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MountainReport) : null;
  } catch {
    return null;
  }
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** Whitefish Mountain summit conditions. Falls back to the last report offline, and hides itself if there has never been one. */
export function Mountain() {
  const [r, setR] = useState<MountainReport | null>(cached);
  useEffect(() => {
    if (r && Date.now() - r.at < 30 * 60 * 1000) return;
    const ctrl = new AbortController();
    fetch(MOUNTAIN_URL, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad status"))))
      .then((j) => {
        const next = summarize(j);
        setR(next);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* offline or blocked: keep what we have */
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!r || !r.days?.length) return null;
  const call = rideCall(r);
  const maxSnow = Math.max(...r.days.map((d) => d.snowIn), 1);
  return (
    <Card tone={call.tone} className="space-y-3" photo="/art/ridge.webp">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading tone={call.tone}>Whitefish Mountain</Heading>
          <div className={label}>Summit forecast · about 6,800 ft</div>
        </div>
        <div className="text-right">
          <div className="font-cc text-5xl font-bold leading-none">{r.temp}°</div>
          <div className={label}>
            wind {r.wind}, gusts {r.gust} mph
          </div>
        </div>
      </div>
      <p className="text-sm">{call.text}</p>
      <div className="grid grid-cols-7 items-end gap-1 text-center" role="img" aria-label={`Snow forecast for the next 7 days: ${r.days.map((d) => `${d.snowIn} inches`).join(", ")}`}>
        {r.days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[9px] text-cc-muted">{d.snowIn > 0 ? `${d.snowIn}"` : ""}</span>
            <div className="w-full rounded-t-md bg-cc-aqua/70" style={{ height: `${Math.max(3, (d.snowIn / maxSnow) * 56)}px` }} />
            <span className="font-mono text-[9px] uppercase text-cc-muted">{new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-cc-line/60 pt-2 text-center">
        <div>
          <div className="font-cc text-2xl font-semibold">{r.depthIn === null ? "n/a" : `${r.depthIn}"`}</div>
          <div className={label}>Snow depth</div>
        </div>
        <div>
          <div className="font-cc text-2xl font-semibold">{clock(r.sunrise)}</div>
          <div className={label}>Sunrise</div>
        </div>
        <div>
          <div className="font-cc text-2xl font-semibold">{clock(r.sunset)}</div>
          <div className={label}>Sunset</div>
        </div>
      </div>
      <a className="inline-flex min-h-11 items-center font-mono text-[10px] uppercase tracking-wider text-cc-aqua underline" href="https://skiwhitefish.com" target="_blank" rel="noopener noreferrer">
        Lifts and runs on the resort site
      </a>
    </Card>
  );
}
