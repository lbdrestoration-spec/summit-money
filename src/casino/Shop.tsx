import type { Actions } from "../store";
import type { State } from "../types";
import { Button, Card, Heading, label } from "../ui";
import { find, isOwned, ITEMS, keyOf } from "./shop";

/** Chip shop: spend play chips on card backs and table felts. */
export function Shop({ state, actions }: { state: State; actions: Actions }) {
  const { shop } = state;
  return (
    <Card tone="violet" className="space-y-3">
      <Heading tone="violet">Chip shop</Heading>
      <p className="text-xs text-cc-muted">Looks only. Nothing here changes any odds, and chips can't be bought with money.</p>
      {(["back", "felt"] as const).map((slot) => (
        <div key={slot}>
          <div className={label}>{slot === "back" ? "Card backs" : "Table felt"}</div>
          <ul className="mt-1 space-y-1">
            {ITEMS.filter((i) => i.slot === slot).map((i) => {
              const owned = isOwned(shop.owned, i);
              const on = find(slot, shop[slot]).id === i.id;
              return (
                <li key={keyOf(i)} className="flex min-h-11 items-center justify-between gap-2 text-sm">
                  <span>{i.name}</span>
                  {owned ? (
                    <Button variant={on ? "lime" : "ghost"} disabled={on} onClick={() => actions.equipItem(slot, i.id)}>
                      {on ? "Equipped" : "Equip"}
                    </Button>
                  ) : (
                    <Button disabled={state.chips < i.price} onClick={() => actions.buyItem(slot, i.id)}>
                      Buy {i.price}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </Card>
  );
}
