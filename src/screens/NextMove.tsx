import { nextMove } from "../nextmove";
import type { State } from "../types";
import { Card, label } from "../ui";

/** One plain-language nudge: the most useful thing to do right now. */
export function NextMove({ state, go }: { state: State; go: (tab: "spend" | "goals" | "plan" | "week") => void }) {
  const m = nextMove(state);
  const tone = m.id === "ok" ? "lime" : m.id === "bill" ? "orange" : "gold";
  return (
    <Card tone={tone} className="space-y-1">
      <div className={label}>Next move</div>
      <p className="text-sm">{m.text}</p>
      {m.tab && (
        <button className="min-h-11 font-mono text-[10px] uppercase tracking-wider text-cc-aqua" onClick={() => go(m.tab as "spend" | "goals" | "plan" | "week")}>
          Go there
        </button>
      )}
    </Card>
  );
}
