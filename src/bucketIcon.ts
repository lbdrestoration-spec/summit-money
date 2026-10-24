const RULES: [RegExp, string][] = [
  [/emerg|rainy|safety|cushion/i, "🛟"],
  [/truck|car|vehicle|auto|jeep/i, "🛻"],
  [/tax/i, "🧾"],
  [/ski|snow|board|pass|mountain|montana|whitefish/i, "🎿"],
  [/trip|travel|vacation|flight|fly|hotel/i, "✈️"],
  [/house|home|down ?payment|rent|mortgage/i, "🏠"],
  [/wedding|ring|date/i, "💍"],
  [/gift|christmas|holiday|dec/i, "🎁"],
  [/phone|laptop|tech|computer/i, "💻"],
  [/invest|stock|retire|roth|ira|401/i, "📈"],
  [/debt|loan|card/i, "💳"],
  [/fun|play|treat/i, "🎉"],
];
/** A friendly icon picked from the bucket's name. Display only, never saved. */
export const bucketIcon = (name: string) => RULES.find(([r]) => r.test(name))?.[1] ?? "🌲";

const PHOTOS: Record<string, string> = { "🛻": "/art/goal-truck.webp", "🏠": "/art/goal-cabin.webp", "🛟": "/art/goal-lantern.webp",
  "🎿": "/art/goal-ski.webp",
  "✈️": "/art/goal-trip.webp",
  "🎁": "/art/goal-gift.webp",
  "💻": "/art/goal-tech.webp",
  "📈": "/art/goal-invest.webp",
  "🎉": "/art/goal-fun.webp",
  "💍": "/art/goal-ring.webp",
};
const SPARE = ["/art/lake.webp", "/art/road.webp", "/art/gondola.webp", "/art/ridge.webp"];
/** A photo that suits the bucket; others rotate through the Montana scenes. */
export const bucketPhoto = (name: string, i: number) => PHOTOS[bucketIcon(name)] ?? SPARE[i % SPARE.length];
