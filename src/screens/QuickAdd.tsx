import { useEffect, useRef, useState } from "react";
import { addDays, iso, money, today } from "../calc";
import { buzz } from "../haptic";
import type { Actions } from "../store";
import type { State } from "../types";
import { bucketIcon } from "../bucketIcon";
import { Button, input, label } from "../ui";

/** Floating + button: log a spend, or put money into savings, from any screen in two taps. */
export function QuickAdd({ state, actions, launch, onLaunched }: { state: State; actions: Actions; launch?: "save" | "spend" | null; onLaunched?: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"spend" | "save">("spend");
  const [bucketId, setBucketId] = useState("");
  const [yesterday, setYesterday] = useState(false);
  const [category, setCategory] = useState(state.categories[0] ?? "Other");
  const ref = useRef<HTMLInputElement>(null);
  const target = bucketId || state.buckets[0]?.id || "";
  const targetName = state.buckets.find((b) => b.id === target)?.name ?? "";
  const when = iso(yesterday ? addDays(today(), -1) : today());
  const valid = Number(amount) > 0 && (mode === "spend" || !!target);

  useEffect(() => {
    if (!launch) return;
    setMode(launch);
    setOpen(true);
    onLaunched?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch]);
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
    if (mode === "save") {
      if (!target) return;
      actions.contribute(target, Number(amount), when);
    } else actions.addSpend({ amount: Number(amount), category, note: "", date: when });
    buzz(20);
    setAmount("");
    setYesterday(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
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
            aria-label={mode === "save" ? "Quick save" : "Quick log a spend"}
            className="rise mx-auto w-full max-w-md space-y-3 rounded-t-3xl border border-b-0 border-cc-line bg-cc-deep p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-1 rounded-full border border-cc-line p-1">
                {(["spend", "save"] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`min-h-9 rounded-full px-4 font-cc text-lg font-semibold uppercase ${mode === m ? (m === "save" ? "bg-cc-lime text-cc-night" : "bg-cc-orange text-cc-night") : "text-cc-muted"}`}
                  >
                    {m === "spend" ? "Spend" : "Save"}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 min-w-11 text-cc-muted" aria-label="Close">
                ✕
              </button>
            </div>
            <input ref={ref} className={`${input} font-cc text-4xl`} inputMode="decimal" placeholder="$0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Quick amount" />
            <div className="flex gap-2" role="group" aria-label="Which day">
              {[false, true].map((y) => (
                <button type="button" key={String(y)} onClick={() => setYesterday(y)} aria-pressed={yesterday === y} className={`min-h-10 flex-1 rounded-full border px-3 text-sm ${yesterday === y ? "border-cc-aqua bg-cc-aqua/15 text-cc-aqua" : "border-cc-line text-cc-muted"}`}>
                  {y ? "Yesterday" : "Today"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {[5, 10, 20, 50].map((n) => (
                <button type="button" key={n} onClick={() => setAmount(String((Number(amount) || 0) + n))} className="min-h-11 flex-1 rounded-lg border border-cc-line bg-cc-night/40 font-cc text-lg">
                  +{n}
                </button>
              ))}
            </div>
            {mode === "save" ? (
              state.buckets.length === 0 ? (
                <p className="text-sm text-cc-muted">Add a savings bucket on the Plan tab first.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {state.buckets.map((b) => (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setBucketId(b.id)}
                      className={`min-h-10 rounded-full border px-3 text-sm ${target === b.id ? "border-cc-lime bg-cc-lime/20 text-cc-lime" : "border-cc-line text-cc-muted"}`}
                    >
                      {bucketIcon(b.name)} {b.name}
                    </button>
                  ))}
                </div>
              )
            ) : (
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
            )}
            <Button variant={mode === "save" ? "lime" : "primary"} type="submit" className="w-full" disabled={!valid}>
              {mode === "save" ? `Save ${valid ? money(Number(amount), { cents: true }) : "it"} to ${targetName || "a bucket"}` : `Log ${valid ? money(Number(amount), { cents: true }) : "it"} as ${category}`}
            </Button>
            <div className={label}>{mode === "save" ? "Saving earns chips and counts toward your goals" : "Logging also keeps your streak and earns chips"}</div>
          </form>
        </div>
      )}
    </>
  );
}
