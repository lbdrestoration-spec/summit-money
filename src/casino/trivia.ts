export type Q = { q: string; a: [string, string, string, string]; ok: 0 | 1 | 2 | 3 };
export const PER_DAY = 3;
export const CHIPS_PER_RIGHT = 10;

export const BANK: Q[] = [
  { q: "What is the capital of Montana?", a: ["Billings", "Helena", "Missoula", "Bozeman"], ok: 1 },
  { q: "Montana's state nickname is...", a: ["The Treasure State", "The Gold State", "The Big Sky Country State", "The Summit State"], ok: 0 },
  { q: "Which is Montana's largest city?", a: ["Missoula", "Great Falls", "Billings", "Helena"], ok: 2 },
  { q: "What is the highest point in Montana?", a: ["Granite Peak", "Mount Cleveland", "Kintla Peak", "Gunsight Mountain"], ok: 0 },
  { q: "Glacier National Park was established in...", a: ["1872", "1910", "1946", "1965"], ok: 1 },
  { q: "Flathead Lake is the largest natural freshwater lake west of which river?", a: ["The Columbia", "The Missouri", "The Mississippi", "The Colorado"], ok: 2 },
  { q: "Which was the first US national park?", a: ["Glacier", "Yosemite", "Yellowstone", "Grand Canyon"], ok: 2 },
  { q: "Snowboarding first appeared at the Winter Olympics in...", a: ["1980", "1988", "1998", "2006"], ok: 2 },
  { q: "The 1965 'Snurfer' was an early ancestor of the...", a: ["Snowmobile", "Snowboard", "Ski lift", "Sled dog harness"], ok: 1 },
  { q: "In snowboarding, a 'goofy' rider has which foot forward?", a: ["Left", "Right", "Neither", "Both"], ok: 1 },
  { q: "A 'regular' snowboard stance puts which foot forward?", a: ["Left", "Right", "Back foot", "It depends on the snow"], ok: 0 },
  { q: "An 'ollie' is a trick where you...", a: ["Spin on your back", "Pop the board into the air", "Slide a rail", "Grab the heel edge"], ok: 1 },
  { q: "The 50/30/20 budget rule puts what share toward savings and debt?", a: ["50%", "30%", "20%", "10%"], ok: 2 },
  { q: "A common emergency fund target is how many months of expenses?", a: ["1", "3 to 6", "12 to 18", "24"], ok: 1 },
  { q: "In the US, FDIC insurance covers up to how much per depositor, per bank?", a: ["$100,000", "$250,000", "$500,000", "$1,000,000"], ok: 1 },
  { q: "Compound interest means you earn interest on...", a: ["Only your deposits", "Deposits and past interest", "Only the bank's money", "Nothing, it's a fee"], ok: 1 },
  { q: "Paying yourself first means...", a: ["Spend, then save what's left", "Save before you spend", "Pay bills last", "Borrow to invest"], ok: 1 },
  { q: "Which is the best hand in poker?", a: ["Four of a kind", "Full house", "Straight flush", "Royal flush"], ok: 3 },
  { q: "How many pockets are on a European roulette wheel?", a: ["36", "37", "38", "40"], ok: 1 },
  { q: "In blackjack, what total are you trying to get closest to without going over?", a: ["18", "20", "21", "25"], ok: 2 },
  { q: "How many cards are in a standard deck, not counting jokers?", a: ["48", "52", "54", "56"], ok: 1 },
  { q: "Which beats a flush in poker?", a: ["A straight", "Three of a kind", "A full house", "Two pair"], ok: 2 },
  { q: "A snowboard's 'camber' is a...", a: ["Flat base", "Slight upward arch under the feet", "Wide nose", "Metal edge"], ok: 1 },
  { q: "Powder snow is best ridden with a board that has...", a: ["A tight sidecut", "A bigger, floatier nose", "No edges", "Thin width"], ok: 1 },
  { q: "Which lake is next to the town of Whitefish?", a: ["Whitefish Lake", "Lake Pend Oreille", "Lake Tahoe", "Hungry Horse Lake"], ok: 0 },
  { q: "Which US state is Whitefish in?", a: ["Idaho", "Wyoming", "Montana", "Washington"], ok: 2 },
  { q: "A dollar saved each day for a year is about...", a: ["$100", "$365", "$730", "$1,000"], ok: 1 },
  { q: "If a savings account earns 5% a year, $1,000 grows to about how much after one year?", a: ["$1,005", "$1,050", "$1,500", "$1,100"], ok: 1 },
  { q: "A Roth IRA is funded with...", a: ["Pre-tax money", "After-tax money", "Borrowed money", "Company stock only"], ok: 1 },
  { q: "On a mountain, what does a black diamond trail mean?", a: ["Beginner", "Intermediate", "Advanced", "Closed"], ok: 2 },
];

/** Whole days since the epoch, using the local calendar date. */
export const dayNumber = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
/** The same three questions all day, a different three tomorrow. */
export const todaysQuestions = (d: Date): Q[] => Array.from({ length: PER_DAY }, (_, k) => BANK[(dayNumber(d) * PER_DAY + k) % BANK.length]);
