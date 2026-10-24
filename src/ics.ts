import { addDays, billsBetween, fridaysBetween, iso, paychecksBetween, today } from "./calc";
import type { State } from "./types";

const stamp = (isoDate: string) => isoDate.replaceAll("-", "");
const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

type Ev = { uid: string; date: string; title: string };

/** Events for the next `days` days: paydays, bill due dates and deadlines. */
export function events(state: State, now = today(), days = 365): Ev[] {
  const to = addDays(now, days);
  const out: Ev[] = [];
  if (state.settings) for (const p of paychecksBetween(state.settings, now, to)) out.push({ uid: `pay-${p.date}`, date: p.date, title: `Payday: $${Math.round(p.amount)}` });
  if (state.plan) {
    for (const f of fridaysBetween(state.plan, now, to)) out.push({ uid: `fri-${f.date}`, date: f.date, title: `Friday pay: $${Math.round(f.amount)}` });
    for (const d of state.plan.deadlines) if (d.date >= iso(now) && d.date <= iso(to)) out.push({ uid: `dl-${d.id}`, date: d.date, title: d.name });
  }
  for (const b of billsBetween(state.bills, now, to)) out.push({ uid: `bill-${b.name}-${b.date}`, date: b.date, title: `Bill due: ${b.name} $${Math.round(b.amount)}` });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** A standard iCalendar file with all-day events. Lines end in CRLF as the format requires. */
export function toIcs(evs: Ev[]): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Summit Money//EN", "CALSCALE:GREGORIAN"];
  for (const e of evs) {
    const next = iso(new Date(new Date(`${e.date}T12:00:00`).getTime() + 86400000));
    lines.push(
      "BEGIN:VEVENT",
      `UID:${esc(e.uid)}@summit-money`,
      `DTSTAMP:${stamp(iso(today()))}T000000Z`,
      `DTSTART;VALUE=DATE:${stamp(e.date)}`,
      `DTEND;VALUE=DATE:${stamp(next)}`,
      `SUMMARY:${esc(e.title)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
