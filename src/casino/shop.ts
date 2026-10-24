export type Item = { id: string; slot: "back" | "felt"; name: string; price: number; hue: number; tint: string };
/** Cosmetics only. Nothing here changes any odds or any real money. */
export const ITEMS: Item[] = [
  { id: "classic", slot: "back", name: "Classic back", price: 0, hue: 0, tint: "" },
  { id: "glacier", slot: "back", name: "Glacier back", price: 300, hue: 150, tint: "" },
  { id: "ember", slot: "back", name: "Ember back", price: 300, hue: -40, tint: "" },
  { id: "aspen", slot: "back", name: "Aspen gold back", price: 600, hue: 60, tint: "" },
  { id: "classic", slot: "felt", name: "Lodge wood", price: 0, hue: 0, tint: "" },
  { id: "pine", slot: "felt", name: "Pine felt", price: 400, hue: 0, tint: "rgba(30,110,60,0.35)" },
  { id: "midnight", slot: "felt", name: "Midnight felt", price: 400, hue: 0, tint: "rgba(30,60,140,0.38)" },
  { id: "velvet", slot: "felt", name: "Velvet red", price: 800, hue: 0, tint: "rgba(150,30,60,0.38)" },
];
export const keyOf = (i: Item) => `${i.slot}:${i.id}`;
export const find = (slot: "back" | "felt", id: string) => ITEMS.find((i) => i.slot === slot && i.id === id) ?? ITEMS.find((i) => i.slot === slot) as Item;
export const isOwned = (owned: string[], i: Item) => i.price === 0 || owned.includes(keyOf(i));
