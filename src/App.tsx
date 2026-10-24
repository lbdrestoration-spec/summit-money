import { useEffect, useRef, useState } from "react";
import { ambienceOn, ambienceWanted, startAmbience, stopAmbience } from "./ambience";
import { bucketPhoto } from "./bucketIcon";
import { money } from "./calc";
import { buzz } from "./haptic";
import { QUEST_BONUS, rankOf, runsToday, trophies } from "./rank";
import { Casino } from "./screens/Casino";
import { Goals } from "./screens/Goals";
import { Home } from "./screens/Home";
import { Personalize } from "./screens/Personalize";
import { Plan } from "./screens/Plan";
import { QuickAdd } from "./screens/QuickAdd";
import { Spend } from "./screens/Spend";
import { Week } from "./screens/Week";
import { Burst, Scene } from "./mountain";
import { totalSaved } from "./plan";
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
  /** Home-screen shortcuts: /?action=save or /?action=spend opens the quick sheet. */
  const [launch, setLaunch] = useState<"save" | "spend" | null>(() => {
    const a = new URLSearchParams(window.location.search).get("action");
    return a === "save" || a === "spend" ? a : null;
  });

  const runs = runsToday(state);
  useEffect(() => {
    if (state.settings && runs.all && !state.questDays.includes(runs.t)) actions.claimQuests(runs.t, QUEST_BONUS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs.all, runs.t, state.questDays]);
  const [amb, setAmb] = useState(false);
  useEffect(() => {
    // browsers only allow sound after a tap, so a remembered "on" starts at the first tap
    if (!ambienceWanted()) return;
    const go = () => {
      startAmbience();
      setAmb(ambienceOn());
    };
    window.addEventListener("pointerdown", go, { once: true });
    return () => window.removeEventListener("pointerdown", go);
  }, []);
  const reached = state.buckets.filter((b) => b.target && b.contributions.reduce((a, c) => a + c.amount, 0) >= b.target).map((b) => b.id);
  const reachedKey = reached.join(",");
  const seenGoals = useRef<string[]>(reached);
  /** Toasts wait in line so two events in one tap both get seen. */
  const [queue, setQueue] = useState<string[]>([]);
  const toast = queue[0] ?? null;
  const headShown = useRef(false);
  /** Milestones (rank, goal, trophy) go before chip toasts; a toast already on screen keeps its place. */
  const setToast = (m: string) =>
    setQueue((q) => {
      if (q.includes(m)) return q;
      const head = headShown.current ? q.slice(0, 1) : [];
      const rest = [...q.slice(head.length), m].sort((a, b) => Number(a.startsWith("+")) - Number(b.startsWith("+")));
      return [...head, ...rest].slice(-4);
    });
  const savedNow = totalSaved(state);
  const savedPrev = useRef(savedNow);
  const [burst, setBurst] = useState(0);
  /** One-tap deposits are easy to mistap, so the newest one can be undone for a few seconds. */
  const allIds = state.buckets.flatMap((b) => b.contributions.map((c) => c.id));
  const knownIds = useRef<Set<string>>(new Set(allIds));
  const [undo, setUndo] = useState<{ bucketId: string; id: string; amount: number; name: string } | null>(null);
  const idKey = allIds.join(",");
  useEffect(() => {
    const fresh = state.buckets.flatMap((b) => b.contributions.filter((c) => !knownIds.current.has(c.id)).map((c) => ({ bucketId: b.id, id: c.id, amount: c.amount, name: b.name })));
    knownIds.current = new Set(allIds);
    if (fresh.length === 1 && fresh[0].amount > 0) setUndo(fresh[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey]);
  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), 5000);
    return () => window.clearTimeout(t);
  }, [undo]);
  useEffect(() => {
    if (savedNow > savedPrev.current) setBurst((n) => n + 1);
    savedPrev.current = savedNow;
  }, [savedNow]);
  const seen = useRef<{ chip: string | undefined; rank: string; idx: number }>({ chip: state.chipLog[0]?.id, rank: rankOf(state).cur.name, idx: rankOf(state).index });
  const [rankUp, setRankUp] = useState<{ kicker: string; name: string; image: string } | null>(null);
  const rankIdx = rankOf(state).index;
  const rankName = rankOf(state).cur.name;
  const lastChip = state.chipLog[0];
  useEffect(() => {
    if (rankName !== seen.current.rank) {
      const up = rankIdx > seen.current.idx;
      seen.current.rank = rankName;
      seen.current.idx = rankIdx;
      if (up) {
        setRankUp({ kicker: "Rank up", name: rankName, image: `/art/rank-${rankIdx}.webp` });
        buzz([40, 30, 40, 30, 120]);
      }
    } else if (lastChip && lastChip.id !== seen.current.chip) {
      setToast(`+${lastChip.amount} chips · ${lastChip.reason}`);
      buzz(20);
    }
    seen.current.chip = lastChip?.id;
  }, [rankName, lastChip]);
  useEffect(() => {
    if (!rankUp) return;
    const t = window.setTimeout(() => setRankUp(null), 4500);
    return () => window.clearTimeout(t);
  }, [rankUp]);
  useEffect(() => {
    const fresh = reached.filter((id) => !seenGoals.current.includes(id));
    if (fresh.length) {
      const b = state.buckets.find((x) => x.id === fresh[0]);
      setToast(`Goal reached: ${b?.name ?? "nice work"}`);
      if (b) setRankUp({ kicker: "Goal reached", name: b.name, image: bucketPhoto(b.name, Math.max(0, state.buckets.filter((x) => x.target).findIndex((x) => x.id === b.id))) });
      buzz([60, 40, 60, 40, 90]);
    }
    seenGoals.current = reached;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reachedKey]);
  const earned = trophies(state).filter((t) => t.earned).map((t) => t.id);
  const earnedKey = earned.join(",");
  const seenTrophies = useRef<string[]>(earned);
  useEffect(() => {
    const fresh = trophies(state).filter((t) => t.earned && !seenTrophies.current.includes(t.id));
    if (fresh.length) {
      setToast(`Trophy: ${fresh[0].name}`);
      buzz([40, 30, 40, 30, 80]);
    }
    seenTrophies.current = earned;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earnedKey]);
  useEffect(() => {
    if (!toast) return;
    headShown.current = true;
    const t = window.setTimeout(() => {
      headShown.current = false;
      setQueue((q) => q.slice(1));
    }, 2600);
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
      {burst > 0 && <Burst key={burst} />}
      {undo && (
        <div role="status" className="rise fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 mx-auto flex w-fit max-w-[92vw] items-center gap-3 rounded-full border border-cc-lime/50 bg-cc-deep/95 py-1 pl-4 pr-1 shadow-lg">
          <span className="text-sm">
            Saved {money(undo.amount, { cents: !Number.isInteger(undo.amount) })} to {undo.name}
          </span>
          <button
            className="min-h-11 rounded-full bg-cc-lime/20 px-4 font-mono text-xs uppercase tracking-wider text-cc-lime"
            onClick={() => {
              actions.removeContribution(undo.bucketId, undo.id);
              setUndo(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
      {rankUp && (
        <button
          onClick={() => setRankUp(null)}
          aria-label={`${rankUp.kicker}: ${rankUp.name}. Tap to continue`}
          className="rise fixed inset-0 z-40 flex flex-col items-center justify-end bg-cc-night bg-cover bg-center p-8 pb-24 text-center"
          style={{ backgroundImage: `linear-gradient(to top, rgba(6,10,18,0.95), rgba(6,10,18,0.15) 60%), url(${rankUp.image})` }}
        >
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-cc-aqua">{rankUp.kicker}</div>
          <div className="mt-2 font-cc text-6xl font-bold uppercase leading-none text-cc-lime">{rankUp.name}</div>
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-cc-muted">Tap to keep going</div>
        </button>
      )}
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
        <div className="flex items-center">
        <button
          onClick={() => {
            if (amb) stopAmbience();
            else startAmbience();
            setAmb(ambienceOn());
          }}
          aria-pressed={amb}
          aria-label="Cabin ambience: wind and fire"
          className={`mr-2 min-h-11 min-w-11 rounded-full border text-lg ${amb ? "border-cc-orange/60 bg-cc-orange/15" : "border-cc-line text-cc-muted"}`}
        >
          {amb ? "🔥" : "❄"}
        </button>
        <button
          onClick={() => setTab("casino")}
          className="min-h-11 rounded-full border border-cc-gold/50 bg-cc-gold/10 px-3 font-cc text-xl text-cc-gold"
          aria-label={`${state.chips} chips. Open the casino`}
        >
          ● {state.chips.toLocaleString()}
        </button>
        </div>
      </header>

      <main className="space-y-4 px-4">
        {tab === "home" && <Home state={state} actions={actions} onCasino={() => setTab("casino")} onPlan={() => setTab("plan")} />}
        {tab === "spend" && <Spend state={state} actions={actions} />}
        {tab === "week" && <Week state={state} actions={actions} />}
        {tab === "goals" && <Goals state={state} actions={actions} />}
        {tab === "plan" && <Plan state={state} actions={actions} onEditPlan={() => setEditingPlan(true)} />}
        {/* Casino stays mounted so a hand in progress survives switching tabs */}
        <div hidden={tab !== "casino"}>
          <Casino state={state} actions={actions} active={tab === "casino"} />
        </div>
      </main>

      {tab !== "casino" && tab !== "spend" && <QuickAdd state={state} actions={actions} launch={launch} onLaunched={() => setLaunch(null)} />}

      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-cc-line bg-cc-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-md">
          {tabs.map((t) => (
            <li key={t.id} className="flex-1">
              <button
                onClick={() => {
                  buzz(8);
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
