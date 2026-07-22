import { useState } from "react";
import { Link } from "react-router-dom";
import XPWindow from "../components/XPWindow.jsx";

const MODES = [
  {
    name: "Classic",
    icon: "▶",
    to: "/play",
    accent: "#004040",
    rules: [
      "Standard dictionary word pool.",
      "120-second round timer.",
      "Wrong guesses just flash a warning — no penalty, keep guessing.",
    ],
  },
  {
    name: "Technical Mode",
    icon: "⚙",
    to: "/play?technical=1",
    accent: "#0891b2",
    rules: [
      "Scrambled base word is always IT/CS vocabulary (kernel, router, cipher, docker...).",
      "Any tech-vocabulary word you find — base or sub-word — is tagged with its category (Networking, AI & Data Science, etc.).",
      "120-second round timer, no life penalty.",
    ],
  },
  {
    name: "Abyssal Mode",
    icon: "☠",
    to: "/play?abyssal=1",
    accent: "#b91c1c",
    rules: [
      "3 lives. Every wrong guess (a word that doesn't exist or isn't in this round) costs one.",
      "3 mistakes and the round ends immediately — you're out, whatever's left on the clock.",
      "Repeating a word you already found doesn't cost a life, only genuinely invalid guesses do.",
    ],
  },
  {
    name: "Glitch Mode",
    icon: "⌁",
    to: "/play?glitch=1",
    accent: "#a21caf",
    rules: [
      "The screen periodically corrupts — scanlines, tearing bands, and a sweeping ⚠ CORRUPTED rift.",
      "The tile row jolts on every corruption burst. Cosmetic only — no score penalty, just nerves.",
    ],
  },
  {
    name: "Blind Mode",
    icon: "◐",
    to: "/play?blind=1",
    accent: "#b45309",
    rules: [
      "Letters are visible for a few seconds after every shuffle, then blur into '?' — play from memory.",
      "Twisting the tiles re-reveals them briefly before they hide again.",
    ],
  },
  {
    name: "Daily Challenge",
    icon: "📅",
    to: "/play?daily=1",
    accent: "#ea580c",
    rules: [
      "One puzzle, shared by everyone who plays today (resets at midnight, Philippine Time).",
      "Same base word and scramble for every player — a fair leaderboard head-to-head.",
    ],
  },
];

const TOGGLES = [
  { key: "technical", icon: "⚙", label: "Technical", hue: { active: "#0891b2", from: "#67e8f9", to: "#0c4a6e", glow: "34,211,238", inactiveBg: "224,247,250" } },
  { key: "abyssal", icon: "☠", label: "Abyssal", hue: { active: "#b91c1c", from: "#fca5a5", to: "#450a0a", glow: "244,63,94", inactiveBg: "254,226,226" } },
  { key: "glitch", icon: "⌁", label: "Glitch", hue: { active: "#a21caf", from: "#f0abfc", to: "#4a044e", glow: "217,70,239", inactiveBg: "250,232,255" } },
  { key: "blind", icon: "◐", label: "Blind", hue: { active: "#b45309", from: "#fcd34d", to: "#451a03", glow: "245,158,11", inactiveBg: "254,243,199" } },
];

function ModeChip({ toggle, active, onClick }) {
  const { hue } = toggle;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative overflow-hidden flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold
                 uppercase tracking-wide backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] active:scale-95"
      style={{
        color: active ? "white" : hue.active,
        background: active
          ? `linear-gradient(180deg, ${hue.from} 0%, ${hue.active} 55%, ${hue.to} 100%)`
          : `linear-gradient(180deg, rgba(255,255,255,0.9), rgba(${hue.inactiveBg},0.6))`,
        border: active ? "1px solid rgba(255,255,255,0.6)" : `1px solid rgba(${hue.glow},0.4)`,
        boxShadow: active
          ? `inset 0 2px 4px rgba(255,255,255,0.45), 0 0 14px rgba(${hue.glow},0.55)`
          : `inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 3px rgba(${hue.glow},0.15)`,
      }}
    >
      <span className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      <span className="relative z-10">
        {toggle.icon} {toggle.label}
      </span>
    </button>
  );
}

// One-shot activation FX duration per mode, in ms — Abyssal's border+logo
// runs the full 5s the user asked for; the rest are quick bursts.
const ACTIVATION_DURATIONS = { technical: 900, abyssal: 5000, glitch: 900, blind: 700 };

export default function HomePage() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [active, setActive] = useState({ technical: false, abyssal: false, glitch: false, blind: false });
  const [activationFx, setActivationFx] = useState(null); // null | "technical" | "abyssal" | "glitch" | "blind"

  const params = Object.entries(active)
    .filter(([, on]) => on)
    .map(([key]) => `${key}=1`);
  const startHref = params.length ? `/play?${params.join("&")}` : "/play";

  function handleToggle(key) {
    const turningOn = !active[key];
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));
    if (turningOn) {
      setActivationFx(key);
      setTimeout(() => setActivationFx(null), ACTIVATION_DURATIONS[key]);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 crt-flicker">
      {/* One-shot mode activation effects */}
      {activationFx === "blind" && <div className="mode-fx-blackout" />}
      {activationFx === "glitch" && (
        <>
          <div className="glitch-scanlines mode-fx-scanlines" />
          <div className="glitch-tear-bands mode-fx-tear-bands" />
          <div className="mode-fx-compromised">
            <span>⚠ SYSTEM COMPROMISED ⚠</span>
          </div>
        </>
      )}
      {activationFx === "abyssal" && (
        <>
          <div className="mode-fx-abyssal-border" />
          <div className="mode-fx-abyssal-logo">☠</div>
        </>
      )}
      {activationFx === "technical" && (
        <>
          <div className="mode-fx-technical" />
          <div className="mode-fx-technical-icon">⚙</div>
          <div className="mode-fx-technical-wrench">🔧</div>
        </>
      )}

      <XPWindow title="SYBORG Text Twist.exe" className="max-w-xl">
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--xp-teal-dark)" }}>
            SYBORG TEXT TWIST
          </h1>
          <p className="text-sm max-w-sm text-gray-700">
            Unscramble the letters, find every hidden word before time runs out,
            and don't forget the bonus word using all the letters. Fire up the
            floppy — it's Y2K o'clock.
          </p>

          {/* Combinable mode toggles — Aero Cyber-Glass capsules */}
          <div className="flex flex-wrap justify-center gap-3">
            {TOGGLES.map((toggle) => (
              <ModeChip
                key={toggle.key}
                toggle={toggle}
                active={active[toggle.key]}
                onClick={() => handleToggle(toggle.key)}
              />
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link to={startHref} className="xp-btn">
              ▶ Start Round
            </Link>
            <Link
              to="/play?daily=1"
              className="relative overflow-hidden px-5 py-2 rounded-full text-sm font-bold text-white
                         bg-gradient-to-b from-orange-300 via-orange-500 to-orange-800 border border-white/50
                         shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_12px_rgba(234,88,12,0.55)]
                         hover:scale-[1.03] active:scale-95 transition-all duration-300"
            >
              <span className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
              <span className="relative z-10">📅 Daily Challenge</span>
            </Link>
            <Link to="/leaderboard" className="xp-btn">
              🏆 High Scores
            </Link>
          </div>

          <button
            onClick={() => setShowChecklist(true)}
            className="xp-btn flex items-center gap-2"
          >
            📋 Game Modes Checklist
          </button>

          <p className="text-xs text-gray-500 max-w-sm">
            Technical scrambles IT/CS terms only. Abyssal gives you 3 lives. Glitch corrupts the
            screen, Blind hides the tiles from memory. Combine any of them, or try today's shared
            Daily Challenge.
          </p>
        </div>
      </XPWindow>

      {showChecklist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowChecklist(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-gray-300 shadow-2xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black" style={{ color: "var(--xp-teal-dark)" }}>
                📋 Game Modes Checklist
              </h2>
              <button
                onClick={() => setShowChecklist(false)}
                className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-[11px] text-gray-500 mb-3">
              Technical, Abyssal, Glitch, and Blind all combine freely — use the toggles on the
              home screen to mix and match. Daily Challenge is its own seeded puzzle.
            </p>

            <div className="flex flex-col gap-4">
              {MODES.map((mode) => (
                <div key={mode.name} className="xp-inset p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: mode.accent }}>
                      {mode.icon} {mode.name}
                    </span>
                    <Link
                      to={mode.to}
                      onClick={() => setShowChecklist(false)}
                      className="text-xs px-3 py-1 rounded-full text-white font-bold"
                      style={{ background: mode.accent }}
                    >
                      Play
                    </Link>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {mode.rules.map((rule) => (
                      <li key={rule} className="text-xs text-gray-700 flex gap-1.5">
                        <span className="text-gray-400">✓</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
