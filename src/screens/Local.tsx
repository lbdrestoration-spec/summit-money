import { useState } from "react";
import type { Actions } from "../store";
import type { State } from "../types";
import { Card, Heading, Progress, label } from "../ui";

export const LOCAL_ITEMS: { id: string; text: string; season: string }[] = [
  { id: "gondola", text: "Ride the gondola on Whitefish Mountain", season: "Winter" },
  { id: "summit", text: "Board from the summit down", season: "Winter" },
  { id: "night", text: "Do a night run under the lights", season: "Winter" },
  { id: "snowshoe", text: "Snowshoe the Whitefish Trail", season: "Winter" },
  { id: "carnival", text: "Catch Whitefish Winter Carnival", season: "Feb" },
  { id: "lake", text: "Sunset walk at Whitefish Lake", season: "Any" },
  { id: "downtown", text: "Dinner downtown on Central Avenue", season: "Any" },
  { id: "mcdonald", text: "Lake McDonald in Glacier National Park", season: "Any" },
  { id: "springs", text: "Soak at a Montana hot spring", season: "Any" },
  { id: "sled", text: "Go dog sledding or snowmobiling", season: "Winter" },
  { id: "sunrise", text: "Watch sunrise from the mountain", season: "Any" },
  { id: "lodge", text: "Hot chocolate by a lodge fire", season: "Winter" },
];

/** A tick-off list of things to do around Whitefish. */
export function Local({ state, actions }: { state: State; actions: Actions }) {
  const [open, setOpen] = useState(false);
  const done = LOCAL_ITEMS.filter((i) => state.local.includes(i.id)).length;
  return (
    <Card tone="violet" className="space-y-3" photo="/art/lake.webp">
      <button className="flex min-h-11 w-full items-center justify-between text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <div>
          <Heading tone="violet">Whitefish list</Heading>
          <div className={label}>
            {done} of {LOCAL_ITEMS.length} done
          </div>
        </div>
        <span aria-hidden="true" className="text-xl text-cc-muted">
          {open ? "−" : "+"}
        </span>
      </button>
      <Progress value={done / LOCAL_ITEMS.length} tone="violet" name="Whitefish list progress" />
      {open && (
        <ul className="space-y-1">
          {LOCAL_ITEMS.map((i) => {
            const on = state.local.includes(i.id);
            return (
              <li key={i.id}>
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <input type="checkbox" checked={on} onChange={() => actions.toggleLocal(i.id)} className="h-5 w-5 accent-cc-violet" />
                  <span className={on ? "text-cc-muted line-through" : ""}>{i.text}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase text-cc-muted">{i.season}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
