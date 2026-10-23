import { useState } from "react";
import { money, parse } from "../calc";
import { projectTo } from "../plan";
import { QUEST_BONUS, RANKS, rankOf, runsToday, trophies } from "../rank";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Empty, Heading, Progress, input, label } from "../ui";

export function RankCard({ state }: { state: State }) {
  const r = rankOf(state);
  return (
    <Card tone="gold" className="space-y-2" photo={`/art/rank-${r.index}.webp`}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className={label}>Trail rank</div>
          <div className="font-cc text-3xl font-bold uppercase leading-none text-cc-gold">
            {r.cur.mark} {r.cur.name}
          </div>
        </div>
        <div className="text-right text-xs text-cc-muted">{r.next ? `${money(r.next.at - r.saved)} to ${r.next.name}` : "Top of the mountain"}</div>
      </div>
      <Progress value={r.progress} tone="gold" name="Progress to next rank" />
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-cc-muted">
        {RANKS.map((x) => (
          <span key={x.name} className={r.saved >= x.at ? "text-cc-gold" : ""}>
            {x.mark}
          </span>
        ))}
      </div>
    </Card>
  );
}

/** Plan what a deadline will cost, and see what's left of your projected savings. */
export function BudgetCards({ state, actions }: { state: State; actions: Actions }) {
  const [draft, setDraft] = useState<Record<string, { n: string; a: string }>>({});
  const deadlines = state.plan?.deadlines ?? [];
  if (!deadlines.length) return null;
  return (
    <>
      {deadlines.map((d) => {
        const items = state.costs[d.id] ?? [];
        const total = items.reduce((a, c) => a + c.amount, 0);
        const p = projectTo(state, d);
        const left = p ? p.projected - total : null;
        const v = draft[d.id] ?? { n: "", a: "" };
        return (
          <Card key={d.id} tone="aqua" className="space-y-3">
            <div>
              <Heading>{d.name} budget</Heading>
              <div className={label}>{parse(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
            {items.length === 0 && <Empty>Add what it will cost: lift tickets, gas, lodging, deposits.</Empty>}
            <ul className="space-y-1">
              {items.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-1">
                  <span className="min-w-0 truncate text-sm">{c.name}</span>
                  <span className="flex items-center">
                    <span className="font-cc text-lg">{money(c.amount)}</span>
                    <button className="min-h-11 px-2 text-cc-muted" aria-label={`Remove ${c.name}`} onClick={() => actions.removeCost(d.id, c.id)}>
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const a = Number(v.a);
                if (v.n.trim() && a > 0) {
                  actions.addCost(d.id, v.n.trim(), a);
                  setDraft((s) => ({ ...s, [d.id]: { n: "", a: "" } }));
                }
              }}
            >
              <input className={input} placeholder="Item" aria-label="Item name" value={v.n} onChange={(e) => setDraft((s) => ({ ...s, [d.id]: { ...v, n: e.target.value } }))} />
              <input className={`${input} !w-24`} inputMode="decimal" placeholder="$" aria-label="Cost" value={v.a} onChange={(e) => setDraft((s) => ({ ...s, [d.id]: { ...v, a: e.target.value } }))} />
              <Button type="submit">Add cost</Button>
            </form>
            {p && (
              <div className="grid grid-cols-3 gap-2 border-t border-cc-line/60 pt-3">
                <div>
                  <div className={label}>Projected</div>
                  <div className="font-cc text-xl text-cc-lime">{money(p.projected)}</div>
                </div>
                <div>
                  <div className={label}>Planned</div>
                  <div className="font-cc text-xl text-cc-orange">{money(total)}</div>
                </div>
                <div>
                  <div className={label}>Left over</div>
                  <div className={`font-cc text-xl ${(left as number) < 0 ? "text-cc-pink" : "text-cc-lime"}`}>{money(left as number)}</div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </>
  );
}

const LIST: { id: string; name: string }[] = [
  { id: "t-tickets", name: "Lift tickets for Whitefish" },
  { id: "t-lodging", name: "Lodging booked" },
  { id: "t-tune", name: "Board or skis tuned" },
  { id: "t-gear", name: "Goggles, gloves, base layers" },
  { id: "t-tires", name: "Winter tires or chains" },
  { id: "t-gas", name: "Gas money set aside" },
  { id: "s-whitefish", name: "Scout: Whitefish" },
  { id: "s-kalispell", name: "Scout: Kalispell" },
  { id: "s-colfalls", name: "Scout: Columbia Falls" },
  { id: "s-bigfork", name: "Scout: Bigfork" },
  { id: "s-rent", name: "Check rents and jobs while there" },
];

export function Checklist({ state, actions }: { state: State; actions: Actions }) {
  const done = LIST.filter((i) => state.packed.includes(i.id)).length;
  return (
    <Card tone="violet" className="space-y-3">
      <div className="flex items-end justify-between">
        <Heading tone="violet">Montana trip</Heading>
        <span className="font-cc text-xl text-cc-violet">
          {done}/{LIST.length}
        </span>
      </div>
      <Progress value={done / LIST.length} tone="violet" name="Checklist progress" />
      <ul className="space-y-1">
        {LIST.map((i) => {
          const on = state.packed.includes(i.id);
          return (
            <li key={i.id}>
              <button
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 text-left text-sm ${on ? "border-cc-violet/50 bg-cc-violet/10 text-cc-muted line-through" : "border-cc-line/70 bg-cc-night/40"}`}
                onClick={() => actions.togglePacked(i.id)}
                aria-pressed={on}
              >
                <span aria-hidden="true">{on ? "☑" : "☐"}</span>
                {i.name}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function TrophyCase({ state }: { state: State }) {
  const t = trophies(state);
  return (
    <Card tone="gold" className="space-y-3">
      <div className="flex items-end justify-between">
        <Heading tone="gold">Trophies</Heading>
        <span className="font-cc text-xl text-cc-gold">
          {t.filter((x) => x.earned).length}/{t.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {t.map((x) => (
          <div key={x.id} className={`rounded-xl border p-3 ${x.earned ? "border-cc-gold/50 bg-cc-gold/10" : "border-cc-line/70 bg-cc-night/40 opacity-80"}`}>
            <div className="text-xl" aria-hidden="true">
              {x.earned ? x.icon : "🔒"}
            </div>
            <div className="font-cc text-lg font-semibold uppercase leading-tight">{x.name}</div>
            <div className="text-xs text-cc-muted">{x.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Journal({ state, actions }: { state: State; actions: Actions }) {
  const [text, setText] = useState("");
  return (
    <Card tone="lime" className="space-y-3">
      <Heading tone="lime">Wins journal</Heading>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            actions.addNote(text.trim());
            setText("");
          }
        }}
      >
        <input className={input} placeholder="One win today" aria-label="Win" value={text} onChange={(e) => setText(e.target.value)} />
        <Button variant="lime" type="submit">
          Save
        </Button>
      </form>
      {state.notes.length === 0 && <Empty>Write down a win. Read it back on a rough day.</Empty>}
      <ul className="space-y-1">
        {state.notes.slice(0, 8).map((n) => (
          <li key={n.id} className="flex items-start justify-between gap-2 rounded-lg border border-cc-line/70 bg-cc-night/40 px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm">{n.text}</div>
              <div className={label}>{n.date}</div>
            </div>
            <button className="min-h-11 px-2 text-cc-muted" aria-label="Remove note" onClick={() => actions.removeNote(n.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function RunsCard({ state }: { state: State }) {
  const r = runsToday(state);
  const done = r.items.filter((i) => i.done).length;
  const paid = state.questDays.includes(r.t);
  return (
    <Card tone="lime" className="space-y-2">
      <div className="flex items-end justify-between">
        <Heading tone="lime">Today's runs</Heading>
        <span className="font-cc text-xl text-cc-lime">{done}/3</span>
      </div>
      <ul className="space-y-1">
        {r.items.map((i) => (
          <li key={i.id} className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm ${i.done ? "border-cc-lime/50 bg-cc-lime/10 text-cc-muted line-through" : "border-cc-line/70 bg-cc-night/40"}`}>
            <span aria-hidden="true">{i.done ? "☑" : "☐"}</span>
            {i.name}
          </li>
        ))}
      </ul>
      <div className={label}>{paid ? `All three done. +${QUEST_BONUS} chips paid` : `Finish all three for +${QUEST_BONUS} chips`}</div>
    </Card>
  );
}
