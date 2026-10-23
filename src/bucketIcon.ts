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
