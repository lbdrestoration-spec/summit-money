import { useState } from "react";
import { iso, today } from "../calc";
import { play } from "../sound";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, label } from "../ui";
import { CHIPS_PER_RIGHT, PER_DAY, todaysQuestions } from "./trivia";

/** Three questions a day about Montana, snowboarding, cards and money. A right answer pays a few chips. */
export function Trivia({ state, actions }: { state: State; actions: Actions }) {
  const date = iso(today());
  const qs = todaysQuestions(today());
  const t = state.trivia.day === date ? state.trivia : { day: date, done: 0, right: 0 };
  // the answer is committed the moment it is picked, so a reload can't be used to retry
  const [last, setLast] = useState<{ q: (typeof qs)[number]; picked: number } | null>(null);
  const finished = t.done >= PER_DAY && !last;
  const q = last ? last.q : qs[Math.min(t.done, PER_DAY - 1)];
  const picked = last ? last.picked : null;
  const shownNo = last ? t.done : t.done + 1;

  if (finished)
    return (
      <Card tone="aqua">
        <Heading tone="aqua">Daily trivia</Heading>
        <p className="mt-1 text-sm">
          Done: {t.right} of {PER_DAY} right. New questions tomorrow.
        </p>
      </Card>
    );

  return (
    <Card tone="aqua" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Heading tone="aqua">Daily trivia</Heading>
        <span className={label}>
          Question {shownNo} of {PER_DAY} · {CHIPS_PER_RIGHT} chips each
        </span>
      </div>
      <p className="text-sm font-semibold">{q.q}</p>
      <div className="grid gap-2">
        {q.a.map((a, i) => {
          const shown = picked !== null;
          const cls = !shown ? "border-cc-line" : i === q.ok ? "border-cc-lime bg-cc-lime/15" : i === picked ? "border-cc-pink bg-cc-pink/15" : "border-cc-line opacity-60";
          return (
            <button
              key={a}
              disabled={shown}
              onClick={() => {
                setLast({ q, picked: i });
                actions.answerTrivia(date, i === q.ok);
                play(i === q.ok ? "win" : "lose");
              }}
              className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${cls}`}
            >
              {a}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="space-y-2" aria-live="polite">
          <p className="text-sm">{picked === q.ok ? `Right. +${CHIPS_PER_RIGHT} chips.` : `Not quite. It was ${q.a[q.ok]}.`}</p>
          <Button onClick={() => setLast(null)}>
            {t.done >= PER_DAY ? "Finish" : "Next question"}
          </Button>
        </div>
      )}
    </Card>
  );
}
