import { useRef, useState } from "react";
import { bucketSaved, iso, money, today } from "../calc";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Empty, Heading, PhotoHeader, input, label } from "../ui";

function Row({ title, sub, right, onDelete }: { title: string; sub?: string; right: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm">{title}</div>
        {sub && <div className="font-mono text-[10px] uppercase tracking-wider text-cc-muted">{sub}</div>}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-cc text-xl">{right}</span>
        <button className="min-h-11 min-w-11 text-cc-muted" onClick={onDelete} aria-label={`Delete ${title}`}>
          ✕
        </button>
      </div>
    </div>
  );
}

export function Plan({ state, actions, onEditPlan }: { state: State; actions: Actions; onEditPlan: () => void }) {
  /* side income */
  const [incAmt, setIncAmt] = useState("");
  const [incNote, setIncNote] = useState("");
  /* bills */
  const [billName, setBillName] = useState("");
  const [billAmt, setBillAmt] = useState("");
  const [billDay, setBillDay] = useState("1");
  /* buckets */
  const [bName, setBName] = useState("");
  const [bPlan, setBPlan] = useState("");
  const [bTarget, setBTarget] = useState("");
  const [bDate, setBDate] = useState("");
  /* categories */
  const [cat, setCat] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const billsTotal = state.bills.reduce((a, b) => a + b.amount, 0);
  const recentIncome = state.incomes.slice(0, 5);

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `summit-money-backup-${iso(today())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    try {
      localStorage.setItem("summit-money:lastBackup", iso(today()));
    } catch {
      /* ignore */
    }
  }
  function importData(file: File) {
    file.text().then((t) => {
      try {
        const parsed = JSON.parse(t);
        if (parsed?.version === 1 && Array.isArray(parsed.spends)) actions.replaceAll(parsed);
        else alert("That file doesn't look like a Summit Money backup.");
      } catch {
        alert("Couldn't read that file.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <PhotoHeader src="/art/lake.webp" title="My plan" sub="Bills, buckets, backup" />
      <Card tone="aqua" className="space-y-2">
        <Heading>What's new</Heading>
        <ul className="space-y-1 text-sm text-cc-snow/90">
          <li>Quick spend: the orange + button on every screen</li>
          <li>Live Whitefish temperature and 5-day snow forecast on Home</li>
          <li>Payday card suggests what to move into each bucket</li>
          <li>Trail ranks, 13 trophies, daily runs for bonus chips</li>
          <li>Feeling the urge? A 10-minute pause and a kept-in-pocket tally</li>
          <li>Trip budgets for Dec 10 and July, plus a Montana checklist</li>
          <li>What if slider, 14-day timeline, month calendar, runway</li>
          <li>Casino: spinning wheel, blackjack split, lodge table, sounds</li>
          <li>Snowflake button up top: cabin wind and fire ambience</li>
          <li>Hold the app icon for shortcuts: Spend, Casino, Goals</li>
        </ul>
      </Card>
      <Card tone="lime">
        <Heading tone="lime">Side income</Heading>
        <p className="mt-1 text-xs text-cc-muted">Log what you make on your own each week.</p>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(incAmt) > 0) {
              actions.addIncome({ amount: Number(incAmt), note: incNote.trim(), date: iso(today()) });
              setIncAmt("");
              setIncNote("");
            }
          }}
        >
          <div className="flex gap-2">
            <input className={input} inputMode="decimal" placeholder="Amount" value={incAmt} onChange={(e) => setIncAmt(e.target.value)} aria-label="Income amount" />
            <input className={input} placeholder="From (optional)" value={incNote} onChange={(e) => setIncNote(e.target.value)} aria-label="Income source" />
          </div>
          <Button variant="lime" className="w-full" type="submit" disabled={!(Number(incAmt) > 0)}>
            Add income
          </Button>
        </form>
        <div className="mt-3 space-y-2">
          {recentIncome.map((i) => (
            <Row key={i.id} title={i.note || "Side income"} sub={i.date} right={money(i.amount, { cents: true })} onDelete={() => actions.removeIncome(i.id)} />
          ))}
        </div>
      </Card>

      <Card tone="pink">
        <div className="flex items-end justify-between">
          <Heading tone="pink">Monthly bills</Heading>
          <div className="font-cc text-2xl text-cc-pink">{money(billsTotal)}</div>
        </div>
        <div className="mt-3 space-y-2">
          {state.bills.length === 0 && <Empty>Add rent, phone, subscriptions, anything that must be paid every month.</Empty>}
          {state.bills.map((b) => (
            <Row key={b.id} title={b.name} sub={`Due day ${b.dueDay}`} right={money(b.amount)} onDelete={() => actions.removeBill(b.id)} />
          ))}
        </div>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (billName.trim() && Number(billAmt) > 0) {
              actions.addBill({ name: billName.trim(), amount: Number(billAmt), dueDay: Math.min(31, Math.max(1, Number(billDay) || 1)) });
              setBillName("");
              setBillAmt("");
            }
          }}
        >
          <input className={input} placeholder="Bill name" value={billName} onChange={(e) => setBillName(e.target.value)} />
          <div className="flex gap-2">
            <input className={input} inputMode="decimal" placeholder="Amount" value={billAmt} onChange={(e) => setBillAmt(e.target.value)} aria-label="Bill amount" />
            <input className={input} inputMode="numeric" placeholder="Due day" value={billDay} onChange={(e) => setBillDay(e.target.value)} aria-label="Due day of month" />
          </div>
          <Button variant="ghost" className="w-full" type="submit">
            Add bill
          </Button>
        </form>
      </Card>

      <Card tone="gold">
        <Heading tone="gold">Savings buckets</Heading>
        <p className="mt-1 text-xs text-cc-muted">Give a bucket a target and it becomes a goal.</p>
        <div className="mt-3 space-y-2">
          {state.buckets.length === 0 && <Empty>No buckets yet.</Empty>}
          {state.buckets.map((b) => (
            <Row
              key={b.id}
              title={b.name}
              sub={`${money(bucketSaved(b))} saved${b.monthlyPlan ? ` · ${money(b.monthlyPlan)}/mo planned` : ""}${b.target ? ` · goal ${money(b.target)}` : ""}`}
              right={money(bucketSaved(b))}
              onDelete={() => {
                if (confirm(`Delete "${b.name}" and its saved history?`)) actions.removeBucket(b.id);
              }}
            />
          ))}
        </div>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!bName.trim()) return;
            actions.addBucket({
              name: bName.trim(),
              monthlyPlan: Number(bPlan) || 0,
              target: Number(bTarget) > 0 ? Number(bTarget) : undefined,
              targetDate: bDate || undefined,
            });
            setBName("");
            setBPlan("");
            setBTarget("");
            setBDate("");
          }}
        >
          <input className={input} placeholder="Bucket name (Emergency, Truck, Taxes...)" value={bName} onChange={(e) => setBName(e.target.value)} />
          <div className="flex gap-2">
            <input className={input} inputMode="decimal" placeholder="Per month" value={bPlan} onChange={(e) => setBPlan(e.target.value)} aria-label="Planned monthly amount" />
            <input className={input} inputMode="decimal" placeholder="Goal (optional)" value={bTarget} onChange={(e) => setBTarget(e.target.value)} aria-label="Goal amount" />
          </div>
          <label className="block space-y-1">
            <span className={label}>Goal date (optional)</span>
            <input className={input} type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} />
          </label>
          <Button variant="ghost" className="w-full" type="submit">
            Add bucket
          </Button>
        </form>
      </Card>

      <Card>
        <Heading>Spending categories</Heading>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.categories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full border border-cc-line pl-3 text-sm">
              {c}
              <button className="min-h-9 min-w-9 text-cc-muted" onClick={() => actions.removeCategory(c)} aria-label={`Remove ${c}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (cat.trim()) {
              actions.addCategory(cat.trim());
              setCat("");
            }
          }}
        >
          <input className={input} placeholder="New category" value={cat} onChange={(e) => setCat(e.target.value)} />
          <Button type="submit">Add</Button>
        </form>
      </Card>

      <Card>
        <Heading tone="violet">My plan</Heading>
        {state.settings && state.plan && (
          <div className="mt-2 space-y-1 text-sm text-cc-muted">
            <p>
              Wednesdays: {money(state.settings.payAnchorAmount)} and {money(state.settings.payOtherAmount)}, taking turns every two weeks.
            </p>
            <p>Fridays: {money(state.plan.fridayAmount)} a week.</p>
            <p>Weekly spending: {money(state.plan.weeklySpending)}.</p>
            {state.plan.deadlines.map((d) => (
              <p key={d.id}>
                {d.name}: {d.date}
                {d.goal ? ` · goal ${money(d.goal)}` : ""}
              </p>
            ))}
          </div>
        )}
        <Button className="mt-3 w-full" onClick={onEditPlan}>
          Edit my plan
        </Button>
      </Card>

      <Card>
        <Heading tone="violet">Backup</Heading>
        <p className="mt-1 text-xs text-cc-muted">Your data lives on this phone only. Save a backup file now and then, so you never lose your history.</p>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={exportData}>
            Save backup
          </Button>
          <Button className="flex-1" onClick={() => fileRef.current?.click()}>
            Restore
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
      </Card>
    </div>
  );
}
