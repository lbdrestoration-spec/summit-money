import { useState } from "react";
import { iso, money, today } from "../calc";
import { rankOf } from "../rank";
import { makeShareCard, shareProgress } from "../shareCard";
import { yearStats } from "../year";
import type { State } from "../types";
import { Button, Card, Heading, label } from "../ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A year-to-date recap with a picture you can share. */
export function YearReview({ state }: { state: State }) {
  const now = today();
  const y = now.getFullYear();
  const st = yearStats(state, y, iso(now));
  const [note, setNote] = useState("");
  const share = async () => {
    setNote("");
    try {
      const blob = await makeShareCard({ photo: "/art/hero-gold.webp", saved: Math.max(0, st.saved), rank: rankOf(state).cur.name, line: `${y} so far` });
      const r = await shareProgress(blob, `summit-money-${y}.png`);
      setNote(r === "shared" ? "Shared." : "Saved a picture to your device.");
    } catch {
      setNote("Couldn't make the picture. Try again.");
    }
  };
  return (
    <Card tone="violet" className="space-y-3">
      <Heading tone="violet">{y} so far</Heading>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className={label}>Saved</div>
          <div className="font-cc text-2xl text-cc-lime">{money(st.saved)}</div>
        </div>
        <div>
          <div className={label}>Days logged</div>
          <div className="font-cc text-2xl">{st.daysLogged}</div>
        </div>
      </div>
      <ul className="space-y-1 text-sm text-cc-snow/90">
        {st.bestMonth && (
          <li>
            Best saving month: {MONTHS[st.bestMonth.month]}, {money(st.bestMonth.amount)}
          </li>
        )}
        {st.topCategory && (
          <li>
            Biggest spending category: {st.topCategory.name}, {money(st.topCategory.amount)}
          </li>
        )}
        {!st.bestMonth && !st.topCategory && <li>Nothing logged this year yet.</li>}
      </ul>
      <Button variant="lime" className="w-full" onClick={share}>
        Share my year
      </Button>
      {note && (
        <p className="text-xs text-cc-muted" aria-live="polite">
          {note}
        </p>
      )}
    </Card>
  );
}
