import { useState } from "react";
import { Goals } from "./screens/Goals";
import { Home } from "./screens/Home";
import { Plan } from "./screens/Plan";
import { Setup } from "./screens/Setup";
import { Spend } from "./screens/Spend";
import { Week } from "./screens/Week";
import { useStore } from "./store";

const tabs = [
  { id: "home", name: "Home", icon: "⛰" },
  { id: "spend", name: "Spend", icon: "＋" },
  { id: "week", name: "Week", icon: "▦" },
  { id: "goals", name: "Goals", icon: "⚑" },
  { id: "plan", name: "Plan", icon: "☰" },
] as const;
type Tab = (typeof tabs)[number]["id"];

export default function App() {
  const { state, actions } = useStore();
  const [tab, setTab] = useState<Tab>("home");

  if (!state.settings) return <Setup actions={actions} />;

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      <header className="flex items-end justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cc-muted">Command Center</div>
          <h1 className="font-cc text-3xl font-bold uppercase leading-none tracking-wide">Summit Money</h1>
        </div>
      </header>

      <main className="space-y-4 px-4">
        {tab === "home" && <Home state={state} actions={actions} />}
        {tab === "spend" && <Spend state={state} actions={actions} />}
        {tab === "week" && <Week state={state} />}
        {tab === "goals" && <Goals state={state} actions={actions} />}
        {tab === "plan" && <Plan state={state} actions={actions} />}
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
