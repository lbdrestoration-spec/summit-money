import { useState } from "react";
import { parse } from "../calc";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, input, label } from "../ui";

// Luke's pay pattern and deadlines, so the app starts out already his
const DEFAULTS = {
  wedStart: "2026-10-28",
  wedFirst: "2000",
  wedSecond: "2500",
  friStart: "2026-10-30",
  friAmount: "920",
  spending: "",
  d1: { name: "Montana ski trip", date: "2026-12-10", goal: "" },
  d2: { name: "Before the move out west", date: "2027-07-04", goal: "" },
};

const dayName = (iso: string) => (iso ? parse(iso).toLocaleDateString("en-US", { weekday: "long" }) : "");

export function Personalize({ state, actions, editing, onDone }: { state: State; actions: Actions; editing: boolean; onDone: () => void }) {
  const { settings, plan } = state;
  const [wedStart, setWedStart] = useState(editing && settings ? settings.payAnchor : DEFAULTS.wedStart);
  const [wedFirst, setWedFirst] = useState(editing && settings ? String(settings.payAnchorAmount) : DEFAULTS.wedFirst);
  const [wedSecond, setWedSecond] = useState(editing && settings ? String(settings.payOtherAmount) : DEFAULTS.wedSecond);
  const [friStart, setFriStart] = useState(editing && plan ? plan.fridayStart : DEFAULTS.friStart);
  const [friAmount, setFriAmount] = useState(editing && plan ? String(plan.fridayAmount) : DEFAULTS.friAmount);
  const [spending, setSpending] = useState(editing && plan ? String(plan.weeklySpending) : DEFAULTS.spending);
  const dl = (i: number) => {
    const d = editing && plan ? plan.deadlines[i] : undefined;
    const def = i === 0 ? DEFAULTS.d1 : DEFAULTS.d2;
    return d ? { name: d.name, date: d.date, goal: d.goal ? String(d.goal) : "" } : def;
  };
  const [d1, setD1] = useState(dl(0));
  const [d2, setD2] = useState(dl(1));

  const ok =
    wedStart && friStart && Number(wedFirst) > 0 && Number(wedSecond) > 0 && Number(friAmount) > 0 && spending !== "" && Number(spending) >= 0 &&
    d1.name.trim() && d1.date && d2.name.trim() && d2.date;

  const Deadline = ({ n, v, set }: { n: number; v: typeof d1; set: (x: typeof d1) => void }) => (
    <div className="space-y-2">
      <div className={label}>Deadline {n}</div>
      <input className={input} value={v.name} onChange={(e) => set({ ...v, name: e.target.value })} aria-label={`Deadline ${n} name`} />
      <div className="flex gap-2">
        <input className={input} type="date" value={v.date} onChange={(e) => set({ ...v, date: e.target.value })} aria-label={`Deadline ${n} date`} />
        <input className={input} inputMode="decimal" placeholder="Goal $ (optional)" value={v.goal} onChange={(e) => set({ ...v, goal: e.target.value })} aria-label={`Deadline ${n} goal amount`} />
      </div>
    </div>
  );

  function save() {
    if (!ok) return;
    actions.savePlan(
      { payAnchor: wedStart, payAnchorAmount: Number(wedFirst), payOtherAmount: Number(wedSecond) },
      {
        fridayStart: friStart,
        fridayAmount: Number(friAmount),
        fridayOverrides: editing && plan ? plan.fridayOverrides : {},
        weeklySpending: Number(spending),
        deadlines: [
          { id: plan?.deadlines[0]?.id ?? "d1", name: d1.name.trim(), date: d1.date, goal: Number(d1.goal) > 0 ? Number(d1.goal) : undefined },
          { id: plan?.deadlines[1]?.id ?? "d2", name: d2.name.trim(), date: d2.date, goal: Number(d2.goal) > 0 ? Number(d2.goal) : undefined },
        ],
      },
    );
    onDone();
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md space-y-4 px-4 py-8">
      <div>
        <div className={label}>Summit Money</div>
        <h1 className="font-cc text-5xl font-bold uppercase leading-none">{editing ? "Edit my plan" : "Make it yours"}</h1>
        <p className="mt-2 text-sm text-cc-muted">
          {editing ? "Change anything, then save." : "I filled this in from what you told me. Check it, add your weekly spending, and save."}
        </p>
      </div>

      <Card tone="aqua" className="space-y-3">
        <Heading>Wednesday pay</Heading>
        <p className="text-xs text-cc-muted">Every other week. The two amounts take turns.</p>
        <label className="block space-y-1">
          <span className={label}>First payday {wedStart && `· ${dayName(wedStart)}`}</span>
          <input className={input} type="date" value={wedStart} onChange={(e) => setWedStart(e.target.value)} />
        </label>
        <div className="flex gap-2">
          <label className="block flex-1 space-y-1">
            <span className={label}>That one pays</span>
            <input className={input} inputMode="decimal" value={wedFirst} onChange={(e) => setWedFirst(e.target.value)} />
          </label>
          <label className="block flex-1 space-y-1">
            <span className={label}>Two weeks later</span>
            <input className={input} inputMode="decimal" value={wedSecond} onChange={(e) => setWedSecond(e.target.value)} />
          </label>
        </div>
      </Card>

      <Card tone="lime" className="space-y-3">
        <Heading tone="lime">Friday pay</Heading>
        <p className="text-xs text-cc-muted">Every week. You can change any week later if you work less.</p>
        <div className="flex gap-2">
          <label className="block flex-1 space-y-1">
            <span className={label}>First Friday {friStart && `· ${dayName(friStart)}`}</span>
            <input className={input} type="date" value={friStart} onChange={(e) => setFriStart(e.target.value)} />
          </label>
          <label className="block flex-1 space-y-1">
            <span className={label}>Usual pay</span>
            <input className={input} inputMode="decimal" value={friAmount} onChange={(e) => setFriAmount(e.target.value)} />
          </label>
        </div>
      </Card>

      <Card tone="orange" className="space-y-2">
        <Heading tone="orange">Weekly spending</Heading>
        <p className="text-xs text-cc-muted">What you let yourself spend each week on food, gas and fun. Your projections subtract this, so be honest.</p>
        <input className={input} inputMode="decimal" placeholder="$ per week" value={spending} onChange={(e) => setSpending(e.target.value)} aria-label="Weekly spending" />
      </Card>

      <Card tone="gold" className="space-y-4">
        <Heading tone="gold">Deadlines</Heading>
        <Deadline n={1} v={d1} set={setD1} />
        <Deadline n={2} v={d2} set={setD2} />
        <p className="text-xs text-cc-muted">Add a goal amount if you know what you need. Your move is July 10, so change deadline 2 to that date if you'd rather.</p>
      </Card>

      <div className="flex gap-2">
        {editing && (
          <Button className="flex-1" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button variant="lime" className="flex-1" disabled={!ok} onClick={save}>
          {editing ? "Save changes" : "Save my plan"}
        </Button>
      </div>
    </div>
  );
}
