import { isRed, rankLabel, SUITS, type Card } from "./cards";

export function CardView({ card, small }: { card: Card | null; small?: boolean }) {
  const size = small ? "h-14 w-10 text-sm" : "h-20 w-14 text-xl";
  if (!card)
    return (
      <div
        aria-label="Face-down card"
        className={`${size} shrink-0 rounded-lg border border-cc-gold/60 bg-cover bg-center shadow-md`}
        style={{ backgroundImage: "url(/art/cardback.webp)" }}
      />
    );
  return (
    <div
      aria-label={`${rankLabel(card.r)} of ${["spades", "hearts", "diamonds", "clubs"][card.s]}`}
      className={`${size} flex shrink-0 flex-col items-center justify-center rounded-lg bg-cc-snow font-cc font-bold leading-none ${isRed(card) ? "text-cc-pink" : "text-cc-night"}`}
    >
      <span>{rankLabel(card.r)}</span>
      <span>{SUITS[card.s]}</span>
    </div>
  );
}

export function Slot({ small }: { small?: boolean }) {
  return <div className={`${small ? "h-14 w-10" : "h-20 w-14"} shrink-0 rounded-lg border border-dashed border-cc-line`} />;
}
