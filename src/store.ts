import { useCallback, useEffect, useState } from "react";
import { emptyState, type Bill, type Bucket, type Income, type Settings, type Spend, type State } from "./types";

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
    clearSettings: () => update((s) => ({ ...s, settings: null })),
    addSpend: (x: Omit<Spend, "id">) => update((s) => ({ ...s, spends: [{ ...x, id: uid() }, ...s.spends] })),
    removeSpend: (id: string) => update((s) => ({ ...s, spends: s.spends.filter((x) => x.id !== id) })),
    addIncome: (x: Omit<Income, "id">) => update((s) => ({ ...s, incomes: [{ ...x, id: uid() }, ...s.incomes] })),
    removeIncome: (id: string) => update((s) => ({ ...s, incomes: s.incomes.filter((x) => x.id !== id) })),
    addBill: (x: Omit<Bill, "id">) => update((s) => ({ ...s, bills: [...s.bills, { ...x, id: uid() }] })),
    removeBill: (id: string) => update((s) => ({ ...s, bills: s.bills.filter((x) => x.id !== id) })),
    addBucket: (x: Omit<Bucket, "id" | "contributions">) =>
      update((s) => ({ ...s, buckets: [...s.buckets, { ...x, id: uid(), contributions: [] }] })),
    removeBucket: (id: string) => update((s) => ({ ...s, buckets: s.buckets.filter((x) => x.id !== id) })),
    contribute: (bucketId: string, amount: number, date: string) =>
      update((s) => ({
        ...s,
        buckets: s.buckets.map((b) =>
          b.id === bucketId ? { ...b, contributions: [...b.contributions, { id: uid(), date, amount }] } : b,
        ),
      })),
    addCategory: (name: string) =>
      update((s) => (s.categories.includes(name) ? s : { ...s, categories: [...s.categories, name] })),
    removeCategory: (name: string) => update((s) => ({ ...s, categories: s.categories.filter((c) => c !== name) })),
    checkin: (date: string) => update((s) => (s.checkins.includes(date) ? s : { ...s, checkins: [...s.checkins, date] })),
    replaceAll: (next: State) => setState(next),
  };

  return { state, actions };
}
export type Actions = ReturnType<typeof useStore>["actions"];
