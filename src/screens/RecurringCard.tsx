import { findRecurring } from "../recurring";
import { money } from "../calc";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading } from "../ui";

/** Charges that repeat every month but aren't in your bills yet. One tap adds them. */
export function RecurringCard({ state, actions }: { state: State; actions: Actions }) {
  const found = findRecurring(state.spends, state.bills);
  if (found.length === 0) return null;
  return (
    <Card tone="orange" className="space-y-3">
      <Heading tone="orange">Looks recurring</Heading>
      <p className="text-xs text-cc-muted">You've paid these about once a month, three or more times, and they aren't in your bills.</p>
      <ul className="space-y-2">
        {found.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-2 text-sm">
            <span>
              {r.name} · {money(r.amount, { cents: r.amount % 1 !== 0 })} · day {r.dueDay}
            </span>
            <Button variant="ghost" onClick={() => actions.addBill({ name: r.name, amount: r.amount, dueDay: r.dueDay })} aria-label={`Add ${r.name} as a bill`}>
              Add bill
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
