const KEY = "summit-money:whitefish";

/** True when the last Whitefish report is fresh and says a meaningful amount of snow falls today. */
export function snowingToday(raw: string | null, now: Date): boolean {
  try {
    if (!raw) return false;
    const r = JSON.parse(raw) as { at?: number; days?: { date: string; snowIn: number }[] };
    if (!r.at || now.getTime() - r.at > 6 * 3600 * 1000 || !r.days?.length) return false;
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const today = r.days.find((d) => d.date === day);
    return !!today && today.snowIn >= 1;
  } catch {
    return false;
  }
}

export function readSnowing(now = new Date()): boolean {
  try {
    return snowingToday(localStorage.getItem(KEY), now);
  } catch {
    return false;
  }
}
