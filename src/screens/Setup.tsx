import { useState } from "react";
import { iso, today } from "../calc";
import type { Actions } from "../store";
import { Button, Card, Heading, input, label } from "../ui";

/** First-run: tell the app your payday pattern */
export function Setup({ actions }: { actions: Actions }) {
  const [anchor, setAnchor] = useState(iso(today()));
  const [first, setFirst] = useState("2000");
  const [second, setSecond] = useState("2500");
  const ok = anchor && Number(first) > 0 && Number(second) > 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-10">
      <div>
        <div className={label}>Summit Money</div>
        <h1 className="font-cc text-5xl font-bold uppercase leading-none">Set your base camp</h1>
        <p className="mt-2 text-sm text-cc-muted">Your paychecks alternate every other week. Tell me one payday and both amounts, and I'll map the whole year.</p>
      </div>
      <Card tone="aqua" className="space-y-3">
        <Heading>Paychecks</Heading>
        <label className="block space-y-1">
          <span className={label}>A payday (past or upcoming)</span>
          <input className={input} type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className={label}>That paycheck is</span>
          <input className={input} inputMode="decimal" value={first} onChange={(e) => setFirst(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className={label}>The one two weeks later is</span>
          <input className={input} inputMode="decimal" value={second} onChange={(e) => setSecond(e.target.value)} />
        </label>
        <Button
          variant="lime"
          className="w-full"
          disabled={!ok}
          onClick={() => actions.saveSettings({ payAnchor: anchor, payAnchorAmount: Number(first), payOtherAmount: Number(second) })}
        >
          Start climbing
        </Button>
      </Card>
    </div>
  );
}
