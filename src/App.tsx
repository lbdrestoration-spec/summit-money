import { useEffect, useRef, useState } from "react";
import { buzz } from "./haptic";
import { QUEST_BONUS, rankOf, runsToday } from "./rank";
import { Casino } from "./screens/Casino";
import { Goals } from "./screens/Goals";
import { Home } from "./screens/Home";
import { Personalize } from "./screens/Personalize";
import { Plan } from "./screens/Plan";
import { Spend } from "./screens/Spend";
import { Week } from "./screens/Week";
import { Scene } from "./mountain";
import { useStore } from "./store";

const tabs = [
  { id: "home", name: "Home", icon: "⛰" },
  { id: "spend", name: "Spend", icon: "＋" },
  { id: "week", name: "Week", icon: "▦" },
  { id: "goals", name: "Goals", icon: "⚑" },
  { id: "casino", name: "Casino", icon: "♠" },
  { id: "plan", name: "Plan", icon: "☰" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export default function App() {
  const { state, actions } = useStore();
  const [tab, setTab] = useState<Tab>(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    return tabs.some((t) => t.id === q) ? (q as Tab) : "home";
  });
  const [editingPlan, setEditingPlan] = useState(false);

  const runs = runsToday(state);
  useEffect(() => {
    if (state.settings && runs.all && !state.questDays.includes(runs.t)) actions.claimQuests(runs.t, QUEST_BONUS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs.all, runs.t, state.questDays]);
  const [toast, setToast] = useState<string | null>(null);
  const seen = useRef<{ chip: string | undefined; rank: string }>({ chip: state.chipLog[0]?.id, rank: rankOf(state).cur.name });
  const rankName = rankOf(state).cur.name;
  const lastChip = state.chipLog[0];
  useEffect(() => {
    if (rankName !== seen.current.rank) {
      seen.current.rank = rankName;
      setToast(`Rank up: ${rankName}`);
      buzz([40, 30, 40]);
    } else if (lastChip && lastChip.id !== seen.current.chip) {
      setToast(`+${lastChip.amount} chips · ${lastChip.reason}`);
      buzz(20);
    }
    seen.current.chip = lastChip?.id;
  }, [rankName, lastChip]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!state.settings || !state.plan || editingPlan)
    return (
      <>
        <Scene />
        <div className="relative z-[1]">
          <Personalize state={state} actions={actions} editing={editingPlan} onDone={() => setEditingPlan(false)} />
        </div>
      </>
    );

  return (
    <div className="relative z-[1] mx-auto min-h-dvh max-w-md pb-24">
      <Scene />
      {toast && (
        <div role="status" className="rise pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-20 mx-auto w-fit max-w-[90vw] rounded-full border border-cc-gold/60 bg-cc-deep/95 px-4 py-2 font-cc text-lg uppercase tracking-wide text-cc-gold shadow-lg">
          {toast}
        </div>
      )}
      <header className="flex items-end justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">Whitefish · Montana</div>
          <h1 className="font-cc text-3xl font-bold uppercase leading-none tracking-wide">Summit Money</h1>
        </div>
        <button
          onClick={() => setTab("casino")}
          className="min-h-11 rounded-full border border-cc-gold/50 bg-cc-gold/10 px-3 font-cc text-xl text-cc-gold"
          aria-label={`${state.chips} chips. Open the casino`}
        >
          ● {state.chips.toLocaleString()}
        </button>
      </header>

      <main className="space-y-4 px-4">
        {tab === "home" && <Home state={state} actions={actions} onCasino={() => setTab("casino")} />}
        {tab === "spend" && <Spend state={state} actions={actions} />}
        {tab === "week" && <Week state={state} actions={actions} />}
        {tab === "goals" && <Goals state={state} actions={actions} />}
        {tab === "plan" && <Plan state={state} actions={actions} onEditPlan={() => setEditingPlan(true)} />}
        {/* Casino stays mounted so a hand in progress survives switching tabs */}
        <div hidden={tab !== "casino"}>
          <Casino state={state} actions={actions} />
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-cc-line bg-cc-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-md">
          {tabs.map((t) => (
            <li key={t.id} className="flex-1">
              <button
                onClick={() => {
                  setTab(t.id);
                  window.scrollTo({ top: 0 });
                }}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 ${tab === t.id ? "text-cc-aqua" : "text-cc-muted"}`}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
