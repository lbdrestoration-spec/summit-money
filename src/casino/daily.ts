import { isLogged } from "../chips";
import type { State } from "../types";

/** Chips on the daily wheel, in wheel order clockwise from the top. */
export const SEGMENTS = [10, 20, 15, 40, 10, 25, 15, 100] as const;
export const SEG_ANGLE = 360 / SEGMENTS.length;
export const CHEST = 50;

/** Rotation that parks segment i under the pointer after `turns` full spins. */
export const angleFor = (i: number, turns = 5) => turns * 360 - i * SEG_ANGLE;

export type Mission = { id: string; label: string; done: boolean };

export function missions(s: State, date: string): Mission[] {
  return [
    { id: "log", label: "Log your day", done: isLogged(s, date) },
    { id: "wheel", label: "Spin the daily wheel", done: s.daily.wheel === date },
    { id: "run", label: "Finish a Gondola Run", done: s.runs.day === date && s.runs.paid > 0 },
    { id: "prep", label: "Do the board prep", done: s.prepDays.includes(date) },
  ];
}
export const allDone = (s: State, date: string) => missions(s, date).every((m) => m.done);
