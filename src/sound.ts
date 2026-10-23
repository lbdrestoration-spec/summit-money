/** Small synthesized casino sounds. No audio files. Mute is remembered on this phone. */
const MUTE_KEY = "summit-money:mute";
let ctx: AudioContext | null = null;

export const isMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
};
export const setMuted = (m: boolean) => {
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
};

function tone(freq: number, start: number, dur: number, type: OscillatorType = "triangle", vol = 0.08) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.02);
}

export function play(kind: "tick" | "win" | "lose" | "big") {
  if (isMuted()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    if (kind === "tick") {
      tone(1400, 0, 0.05, "square", 0.025);
      tone(900, 0.02, 0.06, "triangle", 0.03);
    } else if (kind === "win") {
      [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.18));
    } else if (kind === "big") {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.22));
    } else {
      tone(220, 0, 0.18, "sine", 0.06);
      tone(165, 0.1, 0.25, "sine", 0.06);
    }
  } catch {
    /* audio blocked: stay silent */
  }
}
