/** Wind through pines plus a quiet fireplace crackle, synthesized in the browser. */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let crackleTimer: number | null = null;
let running = false;
const KEY = "summit-money:ambience";

export const ambienceWanted = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
const remember = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
};

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02; // brown noise: soft rumble
    d[i] = last * 3.5;
  }
  return buf;
}

export function startAmbience() {
  if (running) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const c = ctx;
    master = c.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.5, c.currentTime + 2);
    master.connect(c.destination);

    // wind: looping brown noise, band-limited, with a slow breathing volume
    const wind = c.createBufferSource();
    wind.buffer = noiseBuffer(c, 8);
    wind.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    const windGain = c.createGain();
    windGain.gain.value = 0.55;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain).connect(windGain.gain);
    wind.connect(lp).connect(windGain).connect(master);
    wind.start();
    lfo.start();

    // crackle: random short filtered bursts
    const pop = () => {
      if (!running || !ctx || !master) return;
      const n = ctx.createBufferSource();
      const len = Math.floor(ctx.sampleRate * (0.01 + Math.random() * 0.03));
      const b = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = b.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      n.buffer = b;
      const hp = ctx.createBiquadFilter();
      hp.type = "bandpass";
      hp.frequency.value = 1500 + Math.random() * 3000;
      const g = ctx.createGain();
      g.gain.value = 0.05 + Math.random() * 0.12;
      n.connect(hp).connect(g).connect(master);
      n.start();
      crackleTimer = window.setTimeout(pop, 60 + Math.random() * 520);
    };
    running = true;
    pop();
    remember(true);
  } catch {
    running = false;
  }
}

export function stopAmbience() {
  remember(false);
  running = false;
  if (crackleTimer) window.clearTimeout(crackleTimer);
  try {
    if (master && ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      const m = master;
      window.setTimeout(() => m.disconnect(), 800);
    }
  } catch {
    /* ignore */
  }
  master = null;
}

export const ambienceOn = () => running;
