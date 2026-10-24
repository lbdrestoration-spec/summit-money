import { useCallback, useEffect, useState } from "react";
import { iso, today } from "./calc";
import { allDone, CHEST, SEGMENTS } from "./casino/daily";
import { CHIPS_PER_RIGHT, PER_DAY } from "./casino/trivia";
import { isOwned, ITEMS, keyOf } from "./casino/shop";
import { chipsFor, RUNS_PAID_PER_DAY } from "./casino/run-logic";
import { DAILY_LOG, grant, isLogged, PER_DOLLAR } from "./chips";
import { emptyState, type Bill, type Bucket, type Income, type Plan, type Settings, type Spend, type State } from "./types";

const KEY = "summit-money:v1";
export const uid = () => crypto.randomUUID();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as State;
    return parsed.version === 1 ? { ...emptyState(), ...parsed } : emptyState();
  } catch {
    return emptyState();
  }
}

export function useStore() {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep running in memory */
    }
  }, [state]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => fn(s)), []);

  const actions = {
    saveSettings: (settings: Settings) => update((s) => ({ ...s, settings })),
    savePlan: (settings: Settings, plan: Plan) => update((s) => ({ ...s, settings, plan })),
    /** Record what a Friday actually paid. Passing the usual amount (or null) clears the change. */
    setFridayPay: (date: string, amount: number | null) =>
      update((s) => {
        if (!s.plan) return s;
        const overrides = { ...s.plan.fridayOverrides };
        if (amount === null || amount === s.plan.fridayAmount) delete overrides[date];
        else overrides[date] = amount;
        return { ...s, plan: { ...s.plan, fridayOverrides: overrides } };
      }),
    addSpend: (x: Omit<Spend, "id">) =>
      update((s) => {
        const t = iso(today());
        const firstLogToday = x.date === t && !isLogged(s, t);
        const next = { ...s, spends: [{ ...x, id: uid() }, ...s.spends] };
        return firstLogToday ? grant(next, DAILY_LOG, "Logged your day") : next;
      }),
    removeSpend: (id: string) => update((s) => ({ ...s, spends: s.spends.filter((x) => x.id !== id) })),
    addIncome: (x: Omit<Income, "id">) => update((s) => ({ ...s, incomes: [{ ...x, id: uid() }, ...s.incomes] })),
    removeIncome: (id: string) => update((s) => ({ ...s, incomes: s.incomes.filter((x) => x.id !== id) })),
    addBill: (x: Omit<Bill, "id">) => update((s) => ({ ...s, bills: [...s.bills, { ...x, id: uid() }] })),
    removeBill: (id: string) => update((s) => ({ ...s, bills: s.bills.filter((x) => x.id !== id) })),
    addBucket: (x: Omit<Bucket, "id" | "contributions">) =>
      update((s) => ({ ...s, buckets: [...s.buckets, { ...x, id: uid(), contributions: [] }] })),
    updateBucket: (id: string, patch: Partial<Pick<Bucket, "name" | "monthlyPlan" | "target" | "targetDate">>) =>
      update((s) => ({ ...s, buckets: s.buckets.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
    /** Remove one deposit (for a typo). If it came from the 52-week challenge, that week reopens. */
    removeContribution: (bucketId: string, contribId: string) =>
      update((s) => ({
        ...s,
        buckets: s.buckets.map((b) => (b.id === bucketId ? { ...b, contributions: b.contributions.filter((c) => c.id !== contribId) } : b)),
        challenge: s.challenge.filter((c) => c.contribId !== contribId),
      })),
    /** Move the round-up jar into a bucket. The jar is derived, so we only record how much has been moved. */
    moveRoundUp: (bucketId: string, amount: number, date: string) =>
      update((s) => {
        if (amount <= 0 || !s.buckets.some((b) => b.id === bucketId)) return s;
        const next = {
          ...s,
          roundMoved: s.roundMoved + amount,
          buckets: s.buckets.map((b) => (b.id === bucketId ? { ...b, contributions: [...b.contributions, { id: uid(), date, amount }] } : b)),
        };
        return date === iso(today()) ? grant(next, amount * PER_DOLLAR, "Moved round-ups") : next;
      }),
    /** Take money out of a bucket (stored as a negative entry so totals stay honest). Never more than is in it. */
    withdraw: (bucketId: string, amount: number, date: string) =>
      update((s) => {
        const b = s.buckets.find((x) => x.id === bucketId);
        if (!b || !(amount > 0) || amount > b.contributions.reduce((a, c) => a + c.amount, 0) + 1e-9) return s;
        return { ...s, buckets: s.buckets.map((x) => (x.id === bucketId ? { ...x, contributions: [...x.contributions, { id: uid(), date, amount: -amount }] } : x)) };
      }),
    removeBucket: (id: string) => update((s) => ({ ...s, buckets: s.buckets.filter((x) => x.id !== id) })),
    contribute: (bucketId: string, amount: number, date: string) =>
      update((s) => {
        const next = {
          ...s,
          buckets: s.buckets.map((b) =>
            b.id === bucketId ? { ...b, contributions: [...b.contributions, { id: uid(), date, amount }] } : b,
          ),
        };
        return date === iso(today()) ? grant(next, amount * PER_DOLLAR, `Saved $${Math.round(amount)}`) : next;
      }),
    addCategory: (name: string) =>
      update((s) => (s.categories.includes(name) ? s : { ...s, categories: [...s.categories, name] })),
    removeCategory: (name: string) => update((s) => ({ ...s, categories: s.categories.filter((c) => c !== name) })),
    checkin: (date: string) =>
      update((s) => {
        if (s.checkins.includes(date)) return s;
        const firstLogToday = date === iso(today()) && !isLogged(s, date);
        const next = { ...s, checkins: [...s.checkins, date] };
        return firstLogToday ? grant(next, DAILY_LOG, "Logged your day") : next;
      }),
    /** Casino wallet: games call this to take bets and pay out wins. Never goes below zero. */
    adjustChips: (delta: number) => update((s) => ({ ...s, chips: Math.max(0, s.chips + Math.round(delta)) })),
    setTableStack: (n: number) => update((s) => ({ ...s, tableStack: Math.max(0, Math.round(n)) })),
    addResist: (amount: number, note: string) =>
      update((s) => ({ ...s, resisted: [{ id: uid(), date: iso(today()), amount, note }, ...s.resisted] })),
    removeResist: (id: string) => update((s) => ({ ...s, resisted: s.resisted.filter((x) => x.id !== id) })),
    addCost: (deadlineId: string, name: string, amount: number) =>
      update((s) => ({ ...s, costs: { ...s.costs, [deadlineId]: [...(s.costs[deadlineId] ?? []), { id: uid(), name, amount }] } })),
    removeCost: (deadlineId: string, id: string) =>
      update((s) => ({ ...s, costs: { ...s.costs, [deadlineId]: (s.costs[deadlineId] ?? []).filter((c) => c.id !== id) } })),
    addNote: (text: string) => update((s) => ({ ...s, notes: [{ id: uid(), date: iso(today()), text }, ...s.notes].slice(0, 200) })),
    removeNote: (id: string) => update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) })),
    togglePacked: (id: string) =>
      update((s) => ({ ...s, packed: s.packed.includes(id) ? s.packed.filter((x) => x !== id) : [...s.packed, id] })),
    setLimit: (cat: string, amount: number | null) =>
      update((s) => {
        const next = { ...s.catLimits };
        if (amount === null || !(amount > 0)) delete next[cat];
        else next[cat] = amount;
        return { ...s, catLimits: next };
      }),
    /** Pay the daily-runs bonus once per day */
    claimQuests: (date: string, bonus: number) =>
      update((s) => (s.questDays.includes(date) ? s : grant({ ...s, questDays: [...s.questDays, date] }, bonus, "Finished today's runs"))),
    /** Finish a Gondola Run: remember the best, pay chips for the first few runs each day. Returns chips paid. */
    finishRun: (score: number, date: string) =>
      update((s) => {
        const paidToday = s.runs.day === date ? s.runs.paid : 0;
        const best = Math.max(s.runs.best, score);
        const chips = paidToday < RUNS_PAID_PER_DAY ? chipsFor(score) : 0;
        const next = { ...s, runs: { best, day: date, paid: paidToday + (chips > 0 ? 1 : 0), recent: [...(s.runs.recent ?? []), score].slice(-10) } };
        return chips > 0 ? grant(next, chips, `Gondola Run (${score})`) : next;
      }),
    /** Daily wheel: one spin per day. The prize is picked by the caller and paid through the weekly cap. */
    spinDaily: (date: string, prize: number) =>
      update((s) => (s.daily.wheel === date || !SEGMENTS.includes(prize as never) ? s : grant({ ...s, daily: { ...s.daily, wheel: date } }, prize, "Daily wheel"))),
    claimChest: (date: string) =>
      update((s) => (s.daily.chest === date || !allDone(s, date) ? s : grant({ ...s, daily: { ...s.daily, chest: date } }, CHEST, "Daily missions chest"))),
    toggleLocal: (id: string) => update((s) => ({ ...s, local: s.local.includes(id) ? s.local.filter((x) => x !== id) : [...s.local, id] })),
    /** Answer today's next trivia question. Pays chips for a right answer, through the weekly cap. */
    answerTrivia: (date: string, right: boolean) =>
      update((s) => {
        const t = s.trivia.day === date ? s.trivia : { day: date, done: 0, right: 0 };
        if (t.done >= PER_DAY) return s;
        const next = { ...s, trivia: { day: date, done: t.done + 1, right: t.right + (right ? 1 : 0) } };
        return right ? grant(next, CHIPS_PER_RIGHT, "Trivia") : next;
      }),
    /** Buy a cosmetic with chips. Only works with enough chips and never twice. */
    buyItem: (slot: "back" | "felt", id: string) =>
      update((s) => {
        const it = ITEMS.find((i) => i.slot === slot && i.id === id);
        if (!it || isOwned(s.shop.owned, it) || s.chips < it.price) return s;
        return { ...s, chips: s.chips - it.price, shop: { ...s.shop, owned: [...s.shop.owned, keyOf(it)], spent: s.shop.spent + it.price, [slot]: id } };
      }),
    equipItem: (slot: "back" | "felt", id: string) =>
      update((s) => {
        const it = ITEMS.find((i) => i.slot === slot && i.id === id);
        return it && isOwned(s.shop.owned, it) ? { ...s, shop: { ...s.shop, [slot]: id } } : s;
      }),
    setApy: (apy: number) => update((s) => ({ ...s, apy: Math.min(20, Math.max(0, Number.isFinite(apy) ? apy : 0)) })),
    addDebt: (name: string, balance: number, apr: number, payment: number) =>
      update((s) => (balance > 0 && payment > 0 && name.trim() ? { ...s, debts: [...s.debts, { id: uid(), name: name.trim(), balance, apr: Math.max(0, apr), payment }] } : s)),
    removeDebt: (id: string) => update((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) })),
    toggleHidden: (id: string) => update((s) => ({ ...s, hidden: s.hidden.includes(id) ? s.hidden.filter((x) => x !== id) : [...s.hidden, id] })),
    toggleBillPaid: (key: string) => update((s) => ({ ...s, billsPaid: s.billsPaid.includes(key) ? s.billsPaid.filter((x) => x !== key) : [...s.billsPaid, key].slice(-120) })),
    prepDone: (date: string) => update((s) => (s.prepDays.includes(date) ? s : { ...s, prepDays: [...s.prepDays, date] })),
    /** 52-week challenge: week n deposits n x step into a bucket. Undo removes that deposit again. */
    challengeMark: (week: number, bucketId: string, date: string) =>
      update((s) => {
        if (s.challenge.some((c) => c.week === week) || !s.buckets.some((b) => b.id === bucketId)) return s;
        const amount = week * s.challengeStep;
        const contribId = uid();
        const next = {
          ...s,
          buckets: s.buckets.map((b) => (b.id === bucketId ? { ...b, contributions: [...b.contributions, { id: contribId, date, amount }] } : b)),
          challenge: [...s.challenge, { week, bucketId, contribId, date }],
        };
        return date === iso(today()) ? grant(next, amount * PER_DOLLAR, `Challenge week ${week}`) : next;
      }),
    challengeUndo: (week: number) =>
      update((s) => {
        const e = s.challenge.find((c) => c.week === week);
        if (!e) return s;
        return {
          ...s,
          buckets: s.buckets.map((b) => (b.id === e.bucketId ? { ...b, contributions: b.contributions.filter((c) => c.id !== e.contribId) } : b)),
          challenge: s.challenge.filter((c) => c.week !== week),
        };
      }),
    setChallengeStep: (n: number) => update((s) => (s.challenge.length ? s : { ...s, challengeStep: n })),
    replaceAll: (next: State) => setState({ ...emptyState(), ...next }),
  };

  return { state, actions };
}
export type Actions = ReturnType<typeof useStore>["actions"];
