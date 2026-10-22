import type { Settings, State } from "./types";

/* ---------- dates (all local time, ISO yyyy-mm-dd) ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
/** Whole days between two dates, DST-safe */
export const daysBetween = (a: Date, b: Date) =>
  Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
export const today = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
/** Monday-start week */
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
export const inRange = (dateIso: string, from: Date, to: Date) => dateIso >= iso(from) && dateIso <= iso(to);

export const money = (n: number, opts: { cents?: boolean } = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(n);

/* ---------- paychecks: alternating amounts every 14 days ---------- */
export type Paycheck = { date: string; amount: number };
export function paychecksBetween(s: Settings, from: Date, to: Date): Paycheck[] {
  const anchor = parse(s.payAnchor);
  const kMin = Math.ceil(daysBetween(anchor, from) / 14);
  const kMax = Math.floor(daysBetween(anchor, to) / 14);
  const out: Paycheck[] = [];
  for (let k = kMin; k <= kMax; k++) {
    const even = ((k % 2) + 2) % 2 === 0;
    out.push({ date: iso(addDays(anchor, k * 14)), amount: even ? s.payAnchorAmount : s.payOtherAmount });
  }
  return out;
}

/* ---------- month math ---------- */
export function monthStats(state: State, now = today()) {
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const checks = state.settings ? paychecksBetween(state.settings, from, to) : [];
  const paychecks = checks.reduce((a, c) => a + c.amount, 0);
  const sideIncome = state.incomes.filter((i) => inRange(i.date, from, to)).reduce((a, i) => a + i.amount, 0);
  const bills = state.bills.reduce((a, b) => a + b.amount, 0);
  const plannedSavings = state.buckets.reduce((a, b) => a + b.monthlyPlan, 0);
  const spent = state.spends.filter((s) => inRange(s.date, from, to)).reduce((a, s) => a + s.amount, 0);
  const spendable = paychecks + sideIncome - bills - plannedSavings;
  const remaining = spendable - spent;
  const daysLeft = daysBetween(now, to) + 1;
  return {
    paychecks,
    checks,
    sideIncome,
    bills,
    plannedSavings,
    spent,
    spendable,
    remaining,
    daysLeft,
    safeToday: Math.max(0, remaining) / daysLeft,
  };
}

/* ---------- week math ---------- */
export function weekStats(state: State, now = today()) {
  const from = startOfWeek(now);
  const to = addDays(from, 6);
  const spends = state.spends.filter((s) => inRange(s.date, from, to));
  const spent = spends.reduce((a, s) => a + s.amount, 0);
  const byCategory = new Map<string, number>();
  for (const s of spends) byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + s.amount);
  const income = state.incomes.filter((i) => inRange(i.date, from, to)).reduce((a, i) => a + i.amount, 0);
  const saved = state.buckets.flatMap((b) => b.contributions).filter((c) => inRange(c.date, from, to)).reduce((a, c) => a + c.amount, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = iso(addDays(from, i));
    const daySpend = spends.filter((s) => s.date === d).reduce((a, s) => a + s.amount, 0);
    const logged = state.checkins.includes(d) || spends.some((s) => s.date === d);
    return { date: d, spent: daySpend, logged };
  });
  const monthly = monthStats(state, now);
  const weeksLeft = Math.max(1, Math.ceil(monthly.daysLeft / 7));
  const weeklyAllowance = Math.max(0, monthly.remaining + spent) / weeksLeft;
  return {
    from,
    to,
    spent,
    income,
    saved,
    days,
    byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
    weeklyAllowance,
  };
}

/* ---------- streak: consecutive days with a spend or a check-in ---------- */
export function streak(state: State, now = today()) {
  const logged = new Set<string>([...state.checkins, ...state.spends.map((s) => s.date)]);
  let cursor = now;
  if (!logged.has(iso(cursor))) cursor = addDays(cursor, -1);
  let n = 0;
  while (logged.has(iso(cursor))) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

/* ---------- yearly "stock" line: cumulative saved, week by week ---------- */
export type SeriesPoint = { date: string; value: number };
export function savingsSeries(state: State, now = today()): SeriesPoint[] {
  const start = new Date(now.getFullYear(), 0, 1);
  const all = state.buckets.flatMap((b) => b.contributions).sort((a, b) => (a.date < b.date ? -1 : 1));
  const points: SeriesPoint[] = [];
  let i = 0;
  let total = 0;
  for (let d = startOfWeek(start); d <= now; d = addDays(d, 7)) {
    const weekEnd = addDays(d, 6);
    const cutoff = iso(weekEnd < now ? weekEnd : now);
    while (i < all.length && all[i].date <= cutoff) total += all[i++].amount;
    points.push({ date: cutoff, value: total });
  }
  return points;
}

export const bucketSaved = (b: { contributions: { amount: number }[] }) => b.contributions.reduce((a, c) => a + c.amount, 0);
