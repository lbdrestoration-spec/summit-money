export type Payoff = { months: number; interest: number } | null;

/** Months and total interest to clear a balance with a fixed monthly payment. null when the payment never wins. */
export function payoff(balance: number, aprPercent: number, payment: number): Payoff {
  if (!(balance > 0)) return { months: 0, interest: 0 };
  if (!(payment > 0)) return null;
  const r = aprPercent / 100 / 12;
  if (r > 0 && payment <= balance * r) return null;
  let b = balance;
  let interest = 0;
  for (let m = 1; m <= 1200; m++) {
    const i = b * r;
    interest += i;
    b = b + i - payment;
    if (b <= 0.005) return { months: m, interest: Math.round((interest + b) * 100) / 100 };
  }
  return null;
}
