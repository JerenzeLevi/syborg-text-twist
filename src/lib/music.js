// Background theme playlist — cycles through every track in public/audio,
// looping the whole playlist so a booth laptop can just leave it running.
const PLAYLIST = [
  { src: "/audio/frutiger-aero1-aquatic ambience-scizzie.mp3", title: "Frutiger Aero I" },
  { src: "/audio/frutiger-aero2-lotus waters-yume 2kki.mp3", title: "Frutiger Aero II" },
  { src: "/audio/frutiger-aero3-spring colors-takeshi abo official.mp3", title: "Frutiger Aero III" },
  { src: "/audio/frutiger-aero4-lemons.mp3", title: "Frutiger Aero III" },
];

let audio = null;
let trackIndex = 0;
let onTrackChange = null;

function getAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(PLAYLIST[trackIndex].src);
    audio.volume = 0.35;
    audio.addEventListener("ended", () => {
      trackIndex = (trackIndex + 1) % PLAYLIST.length;
      audio.src = PLAYLIST[trackIndex].src;
      audio.play().catch(() => {});
      onTrackChange?.(PLAYLIST[trackIndex]);
    });
  }
  return audio;
}

export function onTrackChanged(cb) {
  onTrackChange = cb;
}

export function currentTrack() {
  return PLAYLIST[trackIndex];
}

export async function playMusic() {
  const el = getAudio();
  if (!el) return false;
  try {
    await el.play();
    return true;
  } catch {
    return false;
  }
}

export function pauseMusic() {
  audio?.pause();
}

export function nextTrack() {
  if (!audio) return;
  trackIndex = (trackIndex + 1) % PLAYLIST.length;
  const wasPlaying = !audio.paused;
  audio.src = PLAYLIST[trackIndex].src;
  if (wasPlaying) audio.play().catch(() => {});
  onTrackChange?.(PLAYLIST[trackIndex]);
}

export function isMusicPlaying() {
  return !!audio && !audio.paused;
}
