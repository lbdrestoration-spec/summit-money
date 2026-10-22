export type Spend = { id: string; date: string; amount: number; category: string; note: string };
export type Income = { id: string; date: string; amount: number; note: string };
export type Bill = { id: string; name: string; amount: number; dueDay: number };
export type Contribution = { id: string; date: string; amount: number };
export type Bucket = {
  id: string;
  name: string;
  /** If set, this bucket also shows up in Goals */
  target?: number;
  targetDate?: string;
  monthlyPlan: number;
  contributions: Contribution[];
};
export type Settings = {
  /** Any real payday (past or future), ISO yyyy-mm-dd */
  payAnchor: string;
  /** Amount of the paycheck on payAnchor */
  payAnchorAmount: number;
  /** Amount of the alternating paycheck (14 days before/after the anchor) */
  payOtherAmount: number;
};
export type State = {
  version: 1;
  settings: Settings | null;
  categories: string[];
  spends: Spend[];
  incomes: Income[];
  bills: Bill[];
  buckets: Bucket[];
  /** Days (ISO) the user checked in, including no-spend days */
  checkins: string[];
};

export const DEFAULT_CATEGORIES = ["Food", "Gas", "Fun", "Business", "Shopping", "Other"];

export const emptyState = (): State => ({
  version: 1,
  settings: null,
  categories: [...DEFAULT_CATEGORIES],
  spends: [],
  incomes: [],
  bills: [],
  buckets: [],
  checkins: [],
});
