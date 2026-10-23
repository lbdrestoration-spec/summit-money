import { addDays, iso, parse, startOfWeek, today } from "./calc";
import { totalSaved } from "./plan";
import type { State } from "./types";

/** Ski-run ranks based on everything you've saved. Derived only, nothing stored. */
export const RANKS = [
  { at: 0, name: "Bunny Hill", mark: "●" },
  { at: 250, name: "Green Circle", mark: "●" },
  { at: 1000, name: "Blue Square", mark: "■" },
  { at: 2500, name: "Black Diamond", mark: "◆" },
  { at: 5000, name: "Double Black", mark: "◆◆" },
  { at: 10000, name: "Summit", mark: "▲" },
] as const;

export function rankOf(state: State) {
  const saved = totalSaved(state);
  let i = 0;
  RANKS.forEach((r, idx) => {
    if (saved >= r.at) i = idx;
  });
  const next = RANKS[i + 1] ?? null;
  const cur = RANKS[i];
  const progress = next ? (saved - cur.at) / (next.at - cur.at) : 1;
  return { saved, cur, index: i, next, progress: Math.max(0, Math.min(1, progress)) };
}

const loggedSet = (s: State) => new Set<string>([...s.checkins, ...s.spends.map((x) => x.date)]);

/** Longest run of logged days ever, so a trophy never disappears when a streak breaks. */
export function bestStreak(s: State) {
  const days = [...loggedSet(s)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && iso(addDays(parse(prev), 1)) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function daysClean(s: State) {
  // Days since the app was started in earnest: first logged day to today.
  const days = [...loggedSet(s)].sort();
  if (!days.length) return 0;
  return Math.max(0, Math.round((today().getTime() - parse(days[0]).getTime()) / 86400000)) + 1;
}

/** Consecutive weeks (Mon to Sun) with at least one deposit into a bucket, counting back from this week or last. */
export function savingWeekStreak(s: State, now = today()) {
  const weeks = new Set<string>();
  s.buckets.forEach((b) => b.contributions.filter((c) => c.amount > 0).forEach((c) => weeks.add(iso(startOfWeek(parse(c.date))))));
  let cursor = startOfWeek(now);
  if (!weeks.has(iso(cursor))) cursor = addDays(cursor, -7);
  let n = 0;
  while (weeks.has(iso(cursor))) {
    n++;
    cursor = addDays(cursor, -7);
  }
  return n;
}

export const keptInPocket = (s: State) => s.resisted.reduce((a, r) => a + r.amount, 0);

export type Trophy = { id: string; name: string; desc: string; icon: string; earned: boolean };
export function trophies(s: State): Trophy[] {
  const saved = totalSaved(s);
  const best = bestStreak(s);
  const resists = s.resisted.length;
  const kept = keptInPocket(s);
  const wedIsh = s.buckets.some((b) => b.contributions.filter((c) => c.amount > 0).length >= 5);
  return [
    { id: "first", name: "First Tracks", desc: "Log your first day", icon: "❄", earned: loggedSet(s).size >= 1 },
    { id: "s3", name: "Warm Up Run", desc: "3 days logged in a row", icon: "⛷", earned: best >= 3 },
    { id: "s7", name: "Full Week", desc: "7 days in a row", icon: "🏔", earned: best >= 7 },
    { id: "s14", name: "Two Weeks Deep", desc: "14 days in a row", icon: "🌲", earned: best >= 14 },
    { id: "s30", name: "Season Pass", desc: "30 days in a row", icon: "🎿", earned: best >= 30 },
    { id: "d100", name: "First Hundred", desc: "Save $100", icon: "◆", earned: saved >= 100 },
    { id: "d500", name: "Powder Stash", desc: "Save $500", icon: "◆", earned: saved >= 500 },
    { id: "d1000", name: "Four Digits", desc: "Save $1,000", icon: "◆", earned: saved >= 1000 },
    { id: "d5000", name: "Big Mountain", desc: "Save $5,000", icon: "▲", earned: saved >= 5000 },
    { id: "r1", name: "Held The Line", desc: "Skip a real-money bet", icon: "✋", earned: resists >= 1 },
    { id: "r10", name: "Ten Skips", desc: "Skip 10 real-money bets", icon: "🛡", earned: resists >= 10 },
    { id: "k500", name: "Kept $500", desc: "Keep $500 in your pocket", icon: "💰", earned: kept >= 500 },
    { id: "w4", name: "Month Of Saving", desc: "Save 4 weeks in a row", icon: "📈", earned: savingWeekStreak(s) >= 4 },
    { id: "d10000", name: "Ten Grand", desc: "Save $10,000", icon: "▲", earned: saved >= 10000 },
    { id: "w12", name: "Season Of Saving", desc: "Save 12 weeks in a row", icon: "🌨", earned: savingWeekStreak(s) >= 12 },
    { id: "habit", name: "Steady Saver", desc: "Put money in a bucket 5 times", icon: "⚑", earned: wedIsh },
  ];
}

export const QUEST_BONUS = 50;
/** Three small habits for today. Derived from what you've already logged. */
export function runsToday(s: State, now = today()) {
  const t = iso(now);
  const items = [
    { id: "log", name: "Log your day", done: s.checkins.includes(t) || s.spends.some((x) => x.date === t) },
    { id: "save", name: "Put money in a bucket", done: s.buckets.some((b) => b.contributions.some((c) => c.amount > 0 && c.date === t)) },
    { id: "win", name: "Write one win", done: s.notes.some((n) => n.date === t) },
  ];
  return { items, all: items.every((i) => i.done), t };
}
