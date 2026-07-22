const MUTE_KEY = "syborg-texttwist:muted";

let ctx = null;
function getContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = AudioCtx ? new AudioCtx() : null;
  }
  return ctx;
}

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

function tone(freq, { duration = 0.12, type = "sine", gain = 0.08, delay = 0 } = {}) {
  if (isMuted()) return;
  const audio = getContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = audio.currentTime + delay;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playCorrect() {
  tone(660, { type: "triangle" });
  tone(880, { type: "triangle", delay: 0.07, duration: 0.15 });
}

export function playTwist() {
  tone(523, { type: "triangle" });
  tone(659, { type: "triangle", delay: 0.08 });
  tone(880, { type: "triangle", delay: 0.16, duration: 0.2 });
}

export function playWrong() {
  tone(180, { type: "sawtooth", duration: 0.18, gain: 0.06 });
}

export function playLifeLost() {
  tone(220, { type: "square", duration: 0.15, gain: 0.09 });
  tone(140, { type: "square", delay: 0.12, duration: 0.25, gain: 0.09 });
}

export function playHint() {
  tone(440, { type: "sine", duration: 0.1, gain: 0.06 });
}

export function playBlindWarning() {
  tone(300, { type: "sine", duration: 0.4, gain: 0.05 });
  tone(300, { type: "sine", delay: 0.5, duration: 0.4, gain: 0.05 });
}
