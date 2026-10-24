/** Short, true-to-life saving habits. One shows per day, cycling in order. */
export const TIPS = [
  "Pay yourself first: move the money the day you get paid, before it can wander.",
  "Wait 48 hours on anything you didn't plan to buy. Most wants fade.",
  "Round up one purchase today and drop the difference into a goal.",
  "A no-spend day is a win. Log it and keep the streak.",
  "Check your bills before the week starts, not when the charge hits.",
  "Small and steady beats big and rare. Ten dollars a day adds up fast.",
  "Name each goal after the thing it buys. It's harder to raid a board fund.",
  "Cook one extra meal at home this week. Log what you didn't spend.",
  "Look at your biggest category this month. One small cut there beats ten tiny ones.",
  "Move a windfall into goals the day it lands. Waiting is how it disappears.",
  "Cancel one thing you haven't used in a month.",
  "Plan the fun spending too. A line for it keeps the rest honest.",
  "Treat a saving streak like a snow streak: show up on the boring days.",
  "Check your goals against the calendar. Dates make money real.",
  "Skip the impulse aisle. Shop with a list and a number.",
  "Pack your own lunch twice this week and bank the difference.",
  "Look at last month's recap. Pick one habit to repeat.",
  "Before buying gear, ask what it costs in saving weeks.",
  "Lower the friction: save from the Home plus button, not later.",
  "Review your recurring charges. Every one is a yearly decision.",
  "Celebrate a finished goal, then start the next one right away.",
  "Keep a small buffer in checking so a surprise doesn't hit your goals.",
  "Match any raise or bonus with a bigger saving amount, not a bigger lifestyle.",
  "Eat before you shop. It's a real thing.",
  "Put a reminder on payday to save first.",
  "Pick one number to beat this week and write it down.",
  "Look for the ride-day costs you forget: gas, snacks, a late-day beer.",
  "A cheap day this week pays for a better ride day later.",
  "Check in on yourself: are your goals still the ones you want?",
  "Do the next right thing with the next dollar.",
];

/** Stable index from a yyyy-mm-dd date: the same tip all day, a new one tomorrow. */
export function tipFor(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return TIPS[((day % TIPS.length) + TIPS.length) % TIPS.length];
}
