import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { currentTrack, isMusicPlaying, nextTrack, onTrackChanged, pauseMusic, playMusic } from "../lib/music.js";
import { unlockAnnoyingBadge } from "../lib/badges.js";
import BadgeIcon from "./BadgeIcon.jsx";

const RAPID_CLICK_COUNT = 10;
const RAPID_CLICK_WINDOW_MS = 3000;

const PH_TIME_FORMAT = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Taskbar() {
  const { pathname } = useLocation();
  const [clockNow, setClockNow] = useState(() => PH_TIME_FORMAT.format(new Date()));
  const [musicOn, setMusicOn] = useState(false);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const [track, setTrack] = useState(() => currentTrack());
  const [annoyedBadge, setAnnoyedBadge] = useState(null);
  const clickTimestampsRef = useRef([]);
  const annoyedBadgeTimeout = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setClockNow(PH_TIME_FORMAT.format(new Date())), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    onTrackChanged(setTrack);
  }, []);

  function trackAnnoyedClick() {
    const now = Date.now();
    const recent = [...clickTimestampsRef.current, now].filter((t) => now - t <= RAPID_CLICK_WINDOW_MS);
    clickTimestampsRef.current = recent;
    if (recent.length < RAPID_CLICK_COUNT) return;
    const badge = unlockAnnoyingBadge();
    if (!badge) return;
    clearTimeout(annoyedBadgeTimeout.current);
    setAnnoyedBadge(badge);
    annoyedBadgeTimeout.current = setTimeout(() => setAnnoyedBadge(null), 3500);
  }

  async function toggleMusic() {
    trackAnnoyedClick();
    if (isMusicPlaying()) {
      pauseMusic();
      setMusicOn(false);
      return;
    }
    const started = await playMusic();
    setMusicOn(started);
    setMusicAvailable(started);
  }

  function skipTrack() {
    nextTrack();
    setTrack(currentTrack());
  }

  return (
    <div className="taskbar fixed bottom-0 left-0 right-0 h-11 flex items-center px-2 gap-2 text-white text-sm z-20">
      <div className="xp-titlebar-btn !w-auto !px-3 !h-8 font-bold" style={{ background: "linear-gradient(180deg,#6ec96e,#2e8b2e)" }}>
        start
      </div>
      <Link
        to="/"
        className={`h-8 px-3 rounded flex items-center ${pathname === "/" ? "bg-black/25" : "hover:bg-black/15"}`}
      >
        Home
      </Link>
      <Link
        to="/play"
        className={`h-8 px-3 rounded flex items-center ${pathname === "/play" ? "bg-black/25" : "hover:bg-black/15"}`}
      >
        Text Twist
      </Link>
      <Link
        to="/rules"
        className={`h-8 px-3 rounded flex items-center ${pathname === "/rules" ? "bg-black/25" : "hover:bg-black/15"}`}
      >
        Rules
      </Link>
      <Link
        to="/leaderboard"
        className={`h-8 px-3 rounded flex items-center ${pathname === "/leaderboard" ? "bg-black/25" : "hover:bg-black/15"}`}
      >
        Leaderboard
      </Link>
      <Link
        to="/about"
        className={`h-8 px-3 rounded flex items-center ${pathname === "/about" ? "bg-black/25" : "hover:bg-black/15"}`}
      >
        About
      </Link>

      <div className="ml-auto flex items-center gap-1">
        {musicOn && (
          <>
            <span className="text-[10px] font-mono text-cyan-100/90 max-w-[9rem] truncate" title={track.title}>
              🎶 {track.title}
            </span>
            <button
              type="button"
              onClick={skipTrack}
              title="Next track"
              className="h-7 w-7 rounded flex items-center justify-center text-xs hover:bg-black/15"
            >
              ⏭
            </button>
          </>
        )}
        <button
          type="button"
          onClick={toggleMusic}
          title={musicAvailable ? "Toggle theme music" : "Add tracks to public/audio to enable"}
          className="h-7 px-2 rounded flex items-center gap-1 text-xs hover:bg-black/15 disabled:opacity-40"
        >
          {musicOn ? "🔊" : "🔈"} Music
        </button>
      </div>
      <div className="xp-inset px-3 h-7 flex items-center text-black text-xs">{clockNow} PHT</div>

      {annoyedBadge && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900/95 border border-cyan-400/50 rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
          <BadgeIcon badge={annoyedBadge} size={32} />
          <div className="text-left">
            <p className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">Badge Unlocked</p>
            <p className="text-sm font-bold text-white">{annoyedBadge.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
