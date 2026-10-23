import { useRef, useState } from "react";
import { bucketSaved, iso, money, today } from "../calc";
import type { Actions } from "../store";
import type { Bucket, State } from "../types";
import { bucketIcon } from "../bucketIcon";
import { Button, Card, Empty, Heading, PhotoHeader, input, label } from "../ui";

function Row({ title, sub, right, onDelete, deleteLabel }: { title: string; sub?: string; right: string; onDelete: () => void; deleteLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm">{title}</div>
        {sub && <div className="font-mono text-[10px] uppercase tracking-wider text-cc-muted">{sub}</div>}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-cc text-xl">{right}</span>
        <button className="min-h-11 min-w-11 text-cc-muted" onClick={onDelete} aria-label={deleteLabel ?? `Delete ${title}`}>
          ✕
        </button>
      </div>
    </div>
  );
}


function BucketEditor({ bucket, onSave, onCancel }: { bucket: Bucket; onSave: (p: Partial<Pick<Bucket, "name" | "monthlyPlan" | "target" | "targetDate">>) => void; onCancel: () => void }) {
  const [name, setName] = useState(bucket.name);
  const [plan, setPlan] = useState(String(bucket.monthlyPlan || ""));
  const [target, setTarget] = useState(bucket.target ? String(bucket.target) : "");
  const [date, setDate] = useState(bucket.targetDate ?? "");
  return (
    <form
      className="space-y-2 rounded-lg border border-cc-gold/50 bg-cc-night/40 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), monthlyPlan: Number(plan) || 0, target: Number(target) > 0 ? Number(target) : undefined, targetDate: date || undefined });
      }}
    >
      <input className={input} value={name} onChange={(e) => setName(e.target.value)} aria-label="Bucket name" />
      <div className="flex gap-2">
        <input className={input} inputMode="decimal" placeholder="Per month" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Edit planned monthly amount" />
        <input className={input} inputMode="decimal" placeholder="Goal" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Edit goal amount" />
      </div>
      <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Edit goal date" />
      <div className="flex gap-2">
        <Button variant="lime" type="submit" className="flex-1">
          Save changes
        </Button>
        <Button type="button" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
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
  const [editing, setEditing] = useState<string | null>(null);
  const [takeOut, setTakeOut] = useState<string | null>(null);
  const [takeAmt, setTakeAmt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const billsTotal = state.bills.reduce((a, b) => a + b.amount, 0);
  const recentIncome = state.incomes.slice(0, 5);
  const deposits = state.buckets
    .flatMap((b) => b.contributions.map((c) => ({ ...c, bucket: b.name, bucketId: b.id })))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 8);

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
  function exportCsv() {
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["type", "date", "amount", "category_or_bucket", "note"],
      ...state.spends.map((x) => ["spend", x.date, x.amount, x.category, x.note]),
      ...state.incomes.map((x) => ["income", x.date, x.amount, "", x.note]),
      ...state.buckets.flatMap((b) => b.contributions.map((c) => [c.amount < 0 ? "withdrawal" : "deposit", c.date, c.amount, b.name, ""])),
    ];
    const body = [rows[0], ...rows.slice(1).sort((a, b) => String(b[1]).localeCompare(String(a[1])))].map((r) => r.map(q).join(",")).join("\n");
    const blob = new Blob([body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `summit-money-history-${iso(today())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
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
          <li>Home leads with saving: milestone ETA, saving streak, split by bucket</li>
          <li>52-week challenge, one-tap Pay yourself first, snow burst on every deposit</li>
          <li>Goals show your pace and finish date; skipped bets can move into savings</li>
          <li>Blackjack insurance when the dealer shows an ace</li>
          <li>The + button saves too: Spend and Save tabs</li>
          <li>Home photo moves with the clock: dawn, day, golden hour, aurora night</li>
          <li>Round-up jar, bills cushion, year-end forecast, saving days grid</li>
          <li>Plan tab: edit buckets, take money out, remove a mistaken deposit, export CSV</li>
          <li>Share a picture of your progress from the Home photo</li>
          <li>Rank-up and goal-reached celebrations, trophy toasts</li>
          <li>Undo button after any deposit, weekly saving ring on the photo</li>
          <li>Goal history charts, biggest-leak card, works offline</li>
          <li>Quick spend: the orange + button on every screen</li>
          <li>Live Whitefish temperature and 5-day snow forecast on Home</li>
          <li>Payday card suggests what to move into each bucket</li>
          <li>Trail ranks, 16 trophies, daily runs for bonus chips</li>
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
          {state.buckets.map((b) =>
            editing === b.id ? (
              <BucketEditor
                key={b.id}
                bucket={b}
                onCancel={() => setEditing(null)}
                onSave={(patch) => {
                  actions.updateBucket(b.id, patch);
                  setEditing(null);
                }}
              />
            ) : (
              <div key={b.id}>
                <Row
                  title={`${bucketIcon(b.name)} ${b.name}`}
                  sub={`${money(bucketSaved(b))} saved${b.monthlyPlan ? ` · ${money(b.monthlyPlan)}/mo planned` : ""}${b.target ? ` · goal ${money(b.target)}` : ""}`}
                  right={money(bucketSaved(b))}
                  onDelete={() => {
                    if (confirm(`Delete "${b.name}" and its saved history?`)) actions.removeBucket(b.id);
                  }}
                />
                <button className="min-h-11 px-3 font-mono text-[10px] uppercase tracking-wider text-cc-aqua" onClick={() => setEditing(b.id)} aria-label={`Edit ${b.name}`}>
                  Edit
                </button>
                <button className="min-h-11 px-3 font-mono text-[10px] uppercase tracking-wider text-cc-orange" onClick={() => { setTakeOut(takeOut === b.id ? null : b.id); setTakeAmt(""); }} aria-label={`Take money out of ${b.name}`}>
                  Take out
                </button>
                {takeOut === b.id && (
                  <form
                    className="mt-1 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const n = Number(takeAmt);
                      if (n > 0 && n <= bucketSaved(b)) {
                        actions.withdraw(b.id, n, iso(today()));
                        setTakeOut(null);
                        setTakeAmt("");
                      }
                    }}
                  >
                    <input className={input} inputMode="decimal" placeholder={`Up to ${money(bucketSaved(b))}`} value={takeAmt} onChange={(e) => setTakeAmt(e.target.value)} aria-label={`Amount to take out of ${b.name}`} />
                    <Button type="submit" disabled={!(Number(takeAmt) > 0 && Number(takeAmt) <= bucketSaved(b))}>
                      Take out
                    </Button>
                  </form>
                )}
              </div>
            ),
          )}
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

      <Card tone="lime">
        <Heading tone="lime">Recent deposits</Heading>
        <p className="mt-1 text-xs text-cc-muted">Tap ✕ to remove a deposit you entered by mistake.</p>
        <div className="mt-3 space-y-2">
          {deposits.length === 0 && <Empty>No deposits yet.</Empty>}
          {deposits.map((d) => (
            <Row key={d.id} title={`${bucketIcon(d.bucket)} ${d.bucket}`} sub={d.date} right={`${d.amount < 0 ? "−" : ""}${money(Math.abs(d.amount), { cents: true })}`} onDelete={() => actions.removeContribution(d.bucketId, d.id)} deleteLabel={`Remove ${money(Math.abs(d.amount), { cents: true })} ${d.amount < 0 ? "withdrawal" : "deposit"} on ${d.date} from ${d.bucket}`} />
          ))}
        </div>
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
          <Button className="flex-1" onClick={exportCsv}>
            Export CSV
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
      </Card>
    </div>
  );
}
