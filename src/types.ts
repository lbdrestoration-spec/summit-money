export type Spend = { id: string; date: string; amount: number; category: string; note: string };
export type Income = { id: string; date: string; amount: number; note: string };
export type Bill = { id: string; name: string; amount: number; dueDay: number };
export type Contribution = { id: string; date: string; amount: number };
export type ChallengeEntry = { week: number; bucketId: string; contribId: string; date: string };
export type Bucket = {
  id: string;
  name: string;
  /** If set, this bucket also shows up in Goals */
  target?: number;
  targetDate?: string;
  monthlyPlan: number;
  contributions: Contribution[];
};
export type Debt = { id: string; name: string; balance: number; apr: number; payment: number };
export type Settings = {
  /** Any real payday (past or future), ISO yyyy-mm-dd */
  payAnchor: string;
  /** Amount of the paycheck on payAnchor */
  payAnchorAmount: number;
  /** Amount of the alternating paycheck (14 days before/after the anchor) */
  payOtherAmount: number;
};
export type Deadline = { id: string; name: string; date: string; goal?: number };
/** Everything personal about how money comes in and what it is working toward */
export type Plan = {
  /** First Friday of the weekly pay, ISO. Pay repeats every 7 days from here. */
  fridayStart: string;
  /** What a normal Friday pays */
  fridayAmount: number;
  /** Fridays that paid something different, keyed by date (ISO) */
  fridayOverrides: Record<string, number>;
  /** What you allow yourself to spend per week (food, gas, fun) */
  weeklySpending: number;
  deadlines: Deadline[];
};
export type ChipEntry = { id: string; date: string; amount: number; reason: string };
/** A time you wanted to place a real-money bet and didn't */
export type Resist = { id: string; date: string; amount: number; note: string };
/** A planned cost for a deadline (lift tickets, gas, deposit) */
export type CostItem = { id: string; name: string; amount: number };
/** One line in the journal */
export type Note = { id: string; date: string; text: string };
export type State = {
  version: 1;
  settings: Settings | null;
  plan: Plan | null;
  categories: string[];
  spends: Spend[];
  incomes: Income[];
  bills: Bill[];
  buckets: Bucket[];
  /** Days (ISO) the user checked in, including no-spend days */
  checkins: string[];
  /** Play-money wallet for the casino. Never bought, never cashed out. */
  chips: number;
  /** Recent chip earnings (used for the weekly earning cap) */
  chipLog: ChipEntry[];
  /** Chips currently sitting at the poker table */
  tableStack: number;
  /** Real-money bets skipped. Pure tally; no chips for it. */
  resisted: Resist[];
  /** Planned costs per deadline id */
  costs: Record<string, CostItem[]>;
  /** Wins journal */
  notes: Note[];
  /** Items checked off the trip checklist, keyed by item id */
  packed: string[];
  /** Optional weekly limit per spending category */
  catLimits: Record<string, number>;
  /** Days (ISO) the daily runs were completed and the bonus paid */
  questDays: string[];
  challenge: ChallengeEntry[];
  challengeStep: number;
  /** Round-up jar chips already moved into savings (the jar itself is derived from spends). */
  roundMoved: number;
  /** Days (ISO) the snowboard prep circuit was finished */
  prepDays: string[];
  /** Gondola Run: best score, and how many runs were paid today */
  runs: { best: number; day: string; paid: number; /** Last 10 scores, newest last (absent in older saves) */ recent?: number[] };
  /** Dates (ISO) the daily wheel was spun and the mission chest opened */
  daily: { wheel: string; chest: string; /** Day the scratch card was taken (absent in older saves) */ scratch?: string };
  /** Whitefish bucket list items checked off */
  local: string[];
  /** Daily trivia: the date, how many were answered, how many were right */
  trivia: { day: string; done: number; right: number };
  /** Chip shop: owned item ids, what is equipped, and total chips spent there */
  shop: { owned: string[]; back: string; felt: string; spent: number };
  /** Yearly rate (percent) used by the interest estimator */
  apy: number;
  /** Debts tracked in the payoff planner */
  debts: Debt[];
  /** Home sections the user switched off */
  hidden: string[];
  /** Bills marked paid, keyed by name and due date */
  billsPaid: string[];
  /** Days (ISO) spent on snow */
  rides: string[];
};

export const DEFAULT_CATEGORIES = ["Food", "Gas", "Fun", "Business", "Shopping", "Other"];

export const emptyState = (): State => ({
  version: 1,
  settings: null,
  plan: null,
  categories: [...DEFAULT_CATEGORIES],
  spends: [],
  incomes: [],
  bills: [],
  buckets: [],
  checkins: [],
  chips: 500,
  chipLog: [],
  tableStack: 0,
  resisted: [],
  costs: {},
  notes: [],
  packed: [],
  catLimits: {},
  questDays: [],
  prepDays: [],
  runs: { best: 0, day: "", paid: 0 },
  daily: { wheel: "", chest: "" },
  local: [],
  trivia: { day: "", done: 0, right: 0 },
  shop: { owned: [], back: "classic", felt: "classic", spent: 0 },
  apy: 4,
  debts: [],
  hidden: [],
  billsPaid: [],
  rides: [],
  challenge: [],
  challengeStep: 1,
  roundMoved: 0,
});
