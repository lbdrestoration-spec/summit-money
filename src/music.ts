/** A slow, generated winter-lodge tune: soft pads over a four-chord loop with the odd bell note. Made in the browser, no audio files. */
const ON_KEY = "summit-money:music";
const VOL_KEY = "summit-money:musicvol";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let running = false;
let step = 0;

export const musicWanted = () => {
  try {
    return localStorage.getItem(ON_KEY) === "1";
  } catch {
    return false;
  }
};
const remember = (on: boolean) => {
  try {
    localStorage.setItem(ON_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
};
export const musicVolume = () => {
  try {
    const raw = localStorage.getItem(VOL_KEY);
    const v = Number(raw);
    return raw === null || !Number.isFinite(v) ? 0.4 : Math.min(1, Math.max(0, v));
  } catch {
    return 0.4;
  }
};
export const setMusicVolume = (v: number) => {
  try {
    localStorage.setItem(VOL_KEY, String(Math.min(1, Math.max(0, v))));
  } catch {
    /* ignore */
  }
  if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(v * 0.5, ctx.currentTime + 0.2);
  }
};
export const musicOn = () => running;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// A minor, F, C, G: root + triad voicings (MIDI notes)
const CHORDS: number[][] = [
  [57, 60, 64, 69],
  [53, 57, 60, 65],
  [48, 55, 60, 64],
  [55, 59, 62, 67],
];
const BELLS = [76, 79, 81, 84, 88]; // A minor pentatonic up high
const CHORD_SECONDS = 8;

function impulse(c: AudioContext) {
  const len = c.sampleRate * 2.5;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

function pad(c: AudioContext, out: AudioNode, freq: number, start: number, dur: number) {
  const g = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(0.09, start + 2.5);
  g.gain.linearRampToValueAtTime(0.0001, start + dur + 2);
  [-6, 0, 6].forEach((cents) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    o.detune.value = cents;
    o.connect(lp);
    o.start(start);
    o.stop(start + dur + 2.1);
  });
  lp.connect(g).connect(out);
}

function bell(c: AudioContext, out: AudioNode, freq: number, start: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 3);
  o.connect(g).connect(out);
  o.start(start);
  o.stop(start + 3.1);
}

function scheduleChord() {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime + 0.1;
  const chord = CHORDS[step % CHORDS.length];
  chord.forEach((n, i) => pad(c, master as GainNode, midi(n), t + i * 0.15, CHORD_SECONDS));
  // two or three bells at random points in the bar
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) bell(c, master, midi(BELLS[Math.floor(Math.random() * BELLS.length)]), t + 1 + Math.random() * (CHORD_SECONDS - 2));
  step++;
}

export function startMusic() {
  if (running) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const c = ctx;
    master = c.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(musicVolume() * 0.5, c.currentTime + 3);
    const verb = c.createConvolver();
    verb.buffer = impulse(c);
    const wet = c.createGain();
    wet.gain.value = 0.5;
    master.connect(c.destination);
    master.connect(verb).connect(wet).connect(c.destination);
    running = true;
    remember(true);
    step = 0;
    scheduleChord();
    timer = window.setInterval(scheduleChord, CHORD_SECONDS * 1000);
  } catch {
    running = false;
  }
}

export function stopMusic() {
  remember(false);
  if (timer) window.clearInterval(timer);
  timer = null;
  running = false;
  if (ctx && master) {
    const m = master;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    window.setTimeout(() => m.disconnect(), 1200);
  }
  master = null;
}
