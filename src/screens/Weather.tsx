import { useEffect, useState } from "react";
import { Card, Heading, label } from "../ui";

type Report = {
  at: number;
  temp: number;
  days: { date: string; snowIn: number; hi: number; lo: number }[];
};
const KEY = "summit-money:whitefish";
// Whitefish, Montana
const URL =
  "https://api.open-meteo.com/v1/forecast?latitude=48.4108&longitude=-114.3376&current=temperature_2m&daily=snowfall_sum,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America%2FDenver&forecast_days=5";

function cached(): Report | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Report) : null;
  } catch {
    return null;
  }
}

/** Live Whitefish conditions. Falls back to the last report when offline, and hides itself if there has never been one. */
export function Weather() {
  const [r, setR] = useState<Report | null>(cached);
  useEffect(() => {
    if (r && Date.now() - r.at < 30 * 60 * 1000) return;
    const ctrl = new AbortController();
    fetch(URL, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad status"))))
      .then((j) => {
        const d = j.daily;
        const next: Report = {
          at: Date.now(),
          temp: Math.round(j.current.temperature_2m),
          days: d.time.map((t: string, i: number) => ({
            date: t,
            snowIn: Math.round((d.snowfall_sum[i] / 2.54) * 10) / 10,
            hi: Math.round(d.temperature_2m_max[i]),
            lo: Math.round(d.temperature_2m_min[i]),
          })),
        };
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
  const total = r.days.reduce((a, d) => a + d.snowIn, 0);
  return (
    <Card tone="aqua" className="space-y-3" photo="/art/gondola.webp">
      <div className="flex items-end justify-between">
        <div>
          <Heading>Whitefish right now</Heading>
          <div className={label}>{total > 0 ? `${total.toFixed(1)} in of snow in the next 5 days` : "No new snow in the next 5 days"}</div>
        </div>
        <div className="font-cc text-5xl font-bold leading-none text-cc-snow">{r.temp}°</div>
      </div>
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {r.days.map((d) => (
          <div key={d.date} className="rounded-lg border border-cc-line/70 bg-cc-night/50 py-2">
            <div className="font-mono text-[10px] uppercase text-cc-muted">{new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div className="font-cc text-xl text-cc-aqua">{d.snowIn > 0 ? `${d.snowIn}"` : "–"}</div>
            <div className="font-mono text-[10px] text-cc-muted">
              {d.hi}°/{d.lo}°
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
