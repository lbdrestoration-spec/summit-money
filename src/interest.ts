/** Estimated value after `months` with a monthly deposit, compounding monthly. apy is a yearly percent. */
export function futureValue(balance: number, monthly: number, apy: number, months = 12) {
  const r = apy / 100 / 12;
  if (r === 0) return balance + monthly * months;
  const g = Math.pow(1 + r, months);
  return balance * g + monthly * ((g - 1) / r);
}
/** Interest only: what the rate adds on top of what you put in. */
export function interestEarned(balance: number, monthly: number, apy: number, months = 12) {
  return futureValue(balance, monthly, apy, months) - balance - monthly * months;
}
