import { useEffect, useRef, useState } from "react";
import BadgeIcon from "../components/BadgeIcon.jsx";
import { unlockEasterEggBadge, unlockGithubFollowBadge } from "../lib/badges.js";

const GLITCH_CHARS = "!@#$%^&*<>/\\|?01#X0Z%$&";

// Renders a string that never stops scrambling — the source text is used only
// for its length, never its characters, so nothing legible is ever leaked
// to the DOM or paintable frame.
function CorruptedText({ length, className = "" }) {
  const [display, setDisplay] = useState(() =>
    Array.from({ length }, () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join("")
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDisplay(
        Array.from({ length }, () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join("")
      );
    }, 90);
    return () => clearInterval(intervalRef.current);
  }, [length]);

  return (
    <span className={`font-mono tracking-widest select-none ${className}`} aria-hidden="true">
      {display}
    </span>
  );
}

export default function AboutPage() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const badgeToastTimeout = useRef(null);

  // Obfuscated Name Array representing your identity
  const obfuscatedIdentity = [74, 101, 114, 101, 110, 122, 101, 32, 76, 101, 118, 105];
  const decodeIdentity = () => String.fromCharCode(...obfuscatedIdentity);

  const flashBadgeToast = (badge) => {
    if (!badge) return;
    clearTimeout(badgeToastTimeout.current);
    setUnlockedBadge(badge);
    badgeToastTimeout.current = setTimeout(() => setUnlockedBadge(null), 3500);
  };

  const handleLogoClick = () => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= 7) { // 7 clicks unlocks the vault
        setShowEasterEgg(true);
        flashBadgeToast(unlockEasterEggBadge());
        return 0;
      }
      return next;
    });
  };

  const handleGithubClick = () => {
    flashBadgeToast(unlockGithubFollowBadge());
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-tr from-blue-900 via-sky-800 to-teal-900 text-white flex flex-col items-center justify-center">

      {/* Main Glassmorphic Panel */}
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">

        {/* Frutiger Aero Glossy Highlight Flare */}
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-3xl" />

        <p className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-[0.3em] mb-3 relative z-10">
          System Identity
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          {/* Creator Images Showcase */}
          <div className="flex gap-3">
            <img
              src="/creator-photo-1.jpg"
              alt="Creator Core"
              className="w-24 h-24 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] object-cover"
            />
            <img
              src="/creator-photo-2.jpg"
              alt="Creator Alter"
              className="w-24 h-24 rounded-full border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] object-cover"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <p className="text-xs font-mono text-emerald-300/80 uppercase tracking-widest mb-1">
              About the Creator
            </p>
            <h1 className="text-3xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-emerald-300">
              {decodeIdentity()}
            </h1>
            <p className="text-xs font-mono text-cyan-200 mt-1 tracking-widest">
              "The Apex" · President, SYBORG Club · A.Y. 2026–2027
            </p>
            <p className="text-[11px] font-mono text-cyan-200/70 mt-0.5 uppercase tracking-widest">
              Syborg Laboratory Environment
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-8 space-y-4 text-sm text-sky-100/90 leading-relaxed relative z-10">
          <p>
            Welcome to <span className="text-cyan-300 font-bold">SYBORG Text Twist</span>. This deployment serves as a conceptual word unscrambling environment built on Top of Vite and TailwindCSS architectures.
          </p>
          <p>
            SYBORG Typing Arena is a personal project built by <span className="text-cyan-300 font-bold">Jerenze Levi</span>, "The Apex," President of the SYBORG Club — the official club for CS, BLIS, and BSIS students — A.Y. 2026–2027.
          </p>
          <p>
            Beyond being a product of pure engineering boredom, this build was designed for students who want to get familiarized with the jargon and technical terminologies tossed around in class — no definitions or concepts explained, just the words themselves, so the terms start feeling familiar before the lecture ever does.
          </p>
          <p>
            This application is a purely personal hobby configuration. No professional dependencies or external academic instructors were involved in the ideation of this specific build.
          </p>
        </div>

        {/* Interactive Triggers & Links */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          {/* Secret Trigger Area (Syborg Logo acting as the stealth toggle) */}
          <button
            onClick={handleLogoClick}
            className="focus:outline-none active:scale-95 transition-transform"
            title="System Diagnostics"
          >
            <img
              src="/syborg-logo.png"
              alt="Syborg Diagnostics"
              className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
            />
          </button>

          {/* GitHub Follow Action */}
          <a
            href="https://github.com/JerenzeLevi"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGithubClick}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-sm font-bold tracking-wide shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            Follow on GitHub
          </a>
        </div>
      </div>

      {/* Badge unlock toast */}
      {unlockedBadge && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900/95 border border-cyan-400/50 rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
          <BadgeIcon badge={unlockedBadge} size={32} />
          <div className="text-left">
            <p className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">Badge Unlocked</p>
            <p className="text-sm font-bold text-white">{unlockedBadge.name}</p>
          </div>
        </div>
      )}

      {/* ─── HIDDEN EASTER EGG MODAL VAULT ─── */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
          <div className="relative bg-gradient-to-b from-slate-900 to-blue-950 p-6 rounded-3xl border border-cyan-500/40 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.3)] text-center">

            <h3 className="text-xl font-mono font-bold text-cyan-400 tracking-wider mb-2">
              [ CORE_MOTIVATION_UNLOCKED ]
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Access Granted to Internal Drivers &amp; Inspiration Matrix
            </p>

            {/* Motivation Image Asset Display */}
            <div className="overflow-hidden rounded-xl border border-white/10 shadow-inner mb-6">
              <img
                src="/motivation.jpg"
                alt="Core Motivation System"
                className="w-full h-auto object-cover max-h-72 hover:scale-105 transition-transform duration-500"
              />
            </div>

            <p className="text-sm text-sky-100/90 italic mb-2">
              Guess who made my heart sink and made my studies for motivation?
            </p>
            <CorruptedText length={16} className="block text-sm text-rose-400/90 mb-6" />

            <button
              onClick={() => setShowEasterEgg(false)}
              className="px-5 py-1.5 text-xs font-mono border border-cyan-400/50 hover:bg-cyan-400/20 text-cyan-300 rounded-lg transition-colors"
            >
              Close Diagnostics Vault
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
