import { useEffect, useRef, useState } from "react";
import { iso, money, today } from "../calc";
import { buzz } from "../haptic";
import type { Actions } from "../store";
import type { State } from "../types";
import { Button, input, label } from "../ui";

/** Floating + button: log a spend from any screen in two taps. */
export function QuickAdd({ state, actions }: { state: State; actions: Actions }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(state.categories[0] ?? "Other");
  const ref = useRef<HTMLInputElement>(null);
  const valid = Number(amount) > 0;

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    actions.addSpend({ amount: Number(amount), category, note: "", date: iso(today()) });
    buzz(20);
    setAmount("");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick log a spend"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-cc-orange text-3xl font-bold text-cc-night shadow-[0_6px_24px_-4px_rgba(255,157,110,0.7)] active:scale-95"
      >
        +
      </button>
      {open && (
        <div className="fixed inset-0 z-30 flex items-end bg-cc-night/70 backdrop-blur-sm" onClick={() => setOpen(false)} role="presentation">
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Quick log a spend"
            className="rise mx-auto w-full max-w-md space-y-3 rounded-t-3xl border border-b-0 border-cc-line bg-cc-deep p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between">
              <span className="font-cc text-2xl font-semibold uppercase text-cc-orange">Quick spend</span>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 min-w-11 text-cc-muted" aria-label="Close">
                ✕
              </button>
            </div>
            <input ref={ref} className={`${input} font-cc text-4xl`} inputMode="decimal" placeholder="$0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Quick amount" />
            <div className="flex gap-2">
              {[5, 10, 20, 50].map((n) => (
                <button type="button" key={n} onClick={() => setAmount(String((Number(amount) || 0) + n))} className="min-h-11 flex-1 rounded-lg border border-cc-line bg-cc-night/40 font-cc text-lg">
                  +{n}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {state.categories.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`min-h-10 rounded-full border px-3 text-sm ${category === c ? "border-cc-orange bg-cc-orange/20 text-cc-orange" : "border-cc-line text-cc-muted"}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Button variant="primary" type="submit" className="w-full" disabled={!valid}>
              Log {valid ? money(Number(amount), { cents: true }) : "it"} as {category}
            </Button>
            <div className={label}>Logging also keeps your streak and earns chips</div>
          </form>
        </div>
      )}
    </>
  );
}
