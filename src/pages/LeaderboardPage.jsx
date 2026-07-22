import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import XPWindow from "../components/XPWindow.jsx";
import BadgeIcon from "../components/BadgeIcon.jsx";
import { filterEntriesByMode, getLeaderboard } from "../lib/storage.js";
import { fetchGlobalLeaderboard } from "../lib/supabase.js";
import { listBadgesWithStatus } from "../lib/badges.js";

const TABS = [
  { key: "all", label: "All" },
  { key: "classic", label: "Classic" },
  { key: "technical", label: "Technical" },
  { key: "abyssal", label: "Abyssal" },
  { key: "glitch", label: "Glitch" },
  { key: "blind", label: "Blind" },
  { key: "daily", label: "Daily" },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState("all");
  const [globalRaw, setGlobalRaw] = useState(null);
  const [badges] = useState(() => listBadgesWithStatus());

  useEffect(() => {
    fetchGlobalLeaderboard()
      .then(setGlobalRaw)
      .catch(() => setGlobalRaw([]));
  }, []);

  const localScores = useMemo(() => getLeaderboard(tab), [tab]);
  const globalScores = useMemo(
    () => (globalRaw ? filterEntriesByMode(globalRaw, tab) : []),
    [globalRaw, tab]
  );

  const isGlobal = globalScores.length > 0;
  const scores = isGlobal ? globalScores : localScores;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <XPWindow title="High Scores.exe" className="max-w-xl">
        <h2 className="text-xl font-black mb-1" style={{ color: "var(--xp-teal-dark)" }}>
          {isGlobal ? "Global High Scores" : "Local High Scores"}
        </h2>
        <p className="text-xs text-gray-600 mb-3">
          {isGlobal ? "Synced from every laptop / phone that's played." : "This device only — connect Supabase for a shared leaderboard."}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition"
              style={{
                color: tab === t.key ? "white" : "var(--xp-teal-dark)",
                background: tab === t.key ? "var(--aero-teal)" : "white",
                border: "1px solid var(--aero-teal)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {scores.length === 0 ? (
          <p className="text-sm text-gray-600 py-6 text-center">No scores yet in this mode — be the first!</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {scores.map((entry, i) => (
              <li
                key={`${entry.name}-${entry.date}-${i}`}
                className="xp-inset flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="font-bold">
                  #{i + 1} {entry.name}
                  {entry.streak > 1 && (
                    <span className="ml-1 text-orange-600" title={`${entry.streak}-day streak`}>
                      🔥{entry.streak}
                    </span>
                  )}
                </span>
                <span>{entry.score} pts</span>
                <span className="text-gray-500">{entry.words_found ?? entry.wordsFound} words</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-black mb-2" style={{ color: "var(--xp-teal-dark)" }}>
            🏅 Badges
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {badges.map((b) => (
              <div
                key={b.id}
                title={b.description}
                className="xp-inset flex flex-col items-center gap-1 p-2"
                style={{ opacity: b.unlocked ? 1 : 0.35, filter: b.unlocked ? "none" : "grayscale(1)" }}
              >
                <BadgeIcon badge={b} size={32} />
                <span className="text-[9px] font-bold text-center leading-tight">{b.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-5 justify-center">
          <Link to="/play" className="xp-btn">
            ▶ Play
          </Link>
          <Link to="/" className="xp-btn">
            🏠 Home
          </Link>
        </div>
      </XPWindow>
    </div>
  );
}
