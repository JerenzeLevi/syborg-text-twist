import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import XPWindow from "../components/XPWindow.jsx";
import LetterTiles from "../components/LetterTiles.jsx";
import SolutionSlots from "../components/SolutionSlots.jsx";
import GlitchOverlay from "../components/GlitchOverlay.jsx";
import BadgeIcon from "../components/BadgeIcon.jsx";
import { useTextTwist } from "../hooks/useTextTwist.js";
import {
  addLeaderboardEntry,
  findLowestEntryForName,
  getGlobalRank,
  recordDailyStreak,
  removeLeaderboardEntry,
} from "../lib/storage.js";
import { submitGlobalScore } from "../lib/supabase.js";
import {
  recordRoundResult,
  unlockAmbulanceBadge,
  unlockBroSpeedBadge,
  unlockHackerBadge,
  unlockKingBelowApexBadge,
  unlockSecretAdmirerBadge,
  unlockSpeedrunChainBadge,
  unlockTheKingBadge,
} from "../lib/badges.js";

const FLASH_COLORS = {
  good: "var(--xp-green)",
  twist: "#7c3aed",
  hint: "#0891b2",
  near: "#b45309",
  bad: "#b91c1c",
};

function buildModeKey({ daily, technical, abyssal, glitch, blind }) {
  const parts = [daily && "daily", technical && "technical", abyssal && "abyssal", glitch && "glitch", blind && "blind"].filter(
    Boolean
  );
  return parts.length ? parts.join("+") : "classic";
}

export default function PlayPage() {
  const [searchParams] = useSearchParams();
  // Independent flags — combinable (e.g. ?technical=1&abyssal=1). "mode="
  // is kept for backward-compatible links from before modes could combine.
  const legacyMode = searchParams.get("mode");
  const technical = searchParams.get("technical") === "1" || legacyMode === "technical";
  const abyssal = searchParams.get("abyssal") === "1" || legacyMode === "abyssal";
  const daily = searchParams.get("daily") === "1";
  const glitch = searchParams.get("glitch") === "1";
  const blind = searchParams.get("blind") === "1";
  const game = useTextTwist({ technical, abyssal, daily, glitch, blind });
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [pendingReplace, setPendingReplace] = useState(null); // { id, score } of the duplicate-name entry awaiting confirmation
  const [newBadges, setNewBadges] = useState([]);
  const [tileShake, setTileShake] = useState(false);
  const [liveBadgeToast, setLiveBadgeToast] = useState(null);
  const recordedRef = useRef(false);
  const seenClearEventRef = useRef(null);
  const liveBadgeToastTimeout = useRef(null);

  function showLiveBadgeToast(badge) {
    if (!badge) return;
    clearTimeout(liveBadgeToastTimeout.current);
    setLiveBadgeToast(badge);
    liveBadgeToastTimeout.current = setTimeout(() => setLiveBadgeToast(null), 3500);
  }

  // Mid-round speedrun badges — these fire the instant a round clears, not
  // at game over, so they can't wait for the round-end badge panel.
  useEffect(() => {
    const event = game.puzzleClearEvent;
    if (!event || event.ts === seenClearEventRef.current) return;
    seenClearEventRef.current = event.ts;
    if (event.fast) showLiveBadgeToast(unlockBroSpeedBadge());
    if (event.tooClose) showLiveBadgeToast(unlockAmbulanceBadge());
    if (event.chainFast) showLiveBadgeToast(unlockSpeedrunChainBadge());
  }, [game.puzzleClearEvent]);

  useEffect(() => {
    function onKeyDown(e) {
      if (game.status !== "playing") return;
      if (e.key === "Enter") return game.submitGuess();
      if (e.key === "Backspace") return game.backspace();
      const key = e.key.toLowerCase();
      const idx = game.letters.findIndex(
        (l, i) => l === key && !game.pickedIndices.includes(i)
      );
      if (idx !== -1) game.pickLetter(idx);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game]);

  // Glitch Mode: periodically jolt the tile row to sell the "corrupted" feel.
  useEffect(() => {
    if (!glitch || game.status !== "playing") return undefined;
    const id = setInterval(() => {
      setTileShake(true);
      setTimeout(() => setTileShake(false), 550);
    }, 2600);
    return () => clearInterval(id);
  }, [glitch, game.status]);

  useEffect(() => {
    recordedRef.current = false;
    setNewBadges([]);
    setSaved(false);
  }, [game.puzzle]);

  useEffect(() => {
    if (game.status !== "finished" || recordedRef.current) return;
    recordedRef.current = true;
    const unlocked = recordRoundResult({
      foundWords: game.foundWords,
      solutions: game.puzzle.solutions,
      base: game.puzzle.base,
      technical,
      abyssal,
      daily,
      glitch,
      blind,
      defeated: game.defeated,
      multiplier: game.multiplier,
      secondWindUsed: game.secondWindUsed,
      hintUsedThisRound: game.hintUsedThisRound,
    });
    if (unlocked.length) setNewBadges(unlocked);
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  function commitSave(trimmed, mode) {
    const streak = daily ? recordDailyStreak(trimmed) : undefined;
    const entryId = addLeaderboardEntry({
      name: trimmed,
      score: game.score,
      wordsFound: game.foundWords.length,
      mode,
      ...(streak ? { streak } : {}),
    });
    submitGlobalScore({ name: trimmed, score: game.score, wordsFound: game.foundWords.length, mode }).catch(
      () => {}
    );
    const secretBadge = unlockSecretAdmirerBadge(trimmed);
    if (secretBadge) setNewBadges((prev) => [...prev, secretBadge]);
    const kingBadge = unlockTheKingBadge(trimmed);
    if (kingBadge) setNewBadges((prev) => [...prev, kingBadge]);

    const rank = getGlobalRank(entryId);
    if (rank === 1) {
      const hackerBadge = unlockHackerBadge();
      if (hackerBadge) setNewBadges((prev) => [...prev, hackerBadge]);
    } else if (rank === 2) {
      const belowApexBadge = unlockKingBelowApexBadge();
      if (belowApexBadge) setNewBadges((prev) => [...prev, belowApexBadge]);
    }

    setSaved(true);
  }

  function handleSave(e) {
    e.preventDefault();
    const trimmed = name.trim() || "Freshman";
    const mode = buildModeKey({ daily, technical, abyssal, glitch, blind });
    const duplicate = findLowestEntryForName(trimmed, mode);
    if (duplicate) {
      setPendingReplace({ id: duplicate.id, score: duplicate.score, trimmed, mode });
      return;
    }
    commitSave(trimmed, mode);
  }

  function confirmReplace() {
    removeLeaderboardEntry(pendingReplace.id);
    commitSave(pendingReplace.trimmed, pendingReplace.mode);
    setPendingReplace(null);
  }

  function cancelReplace() {
    setPendingReplace(null);
  }

  const solvedAll = game.foundWords.length === game.puzzle.solutions.length;
  const titleParts = [];
  if (daily) titleParts.push("Daily Challenge");
  if (technical) titleParts.push("Technical");
  if (abyssal) titleParts.push("Abyssal");
  if (glitch) titleParts.push("Glitch");
  if (blind) titleParts.push("Blind");

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <GlitchOverlay active={glitch && game.status === "playing"} />
      {blind && game.lettersHidden && game.status === "playing" && <div className="blind-vignette" />}
      {blind && game.blindWarning && game.status === "playing" && <div className="blind-warning" />}
      {blind && game.blackout && game.status === "playing" && <div className="blind-blackout" />}

      {liveBadgeToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900/95 border border-cyan-400/50 rounded-2xl px-4 py-3 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
          <BadgeIcon badge={liveBadgeToast} size={32} />
          <div className="text-left">
            <p className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">Badge Unlocked</p>
            <p className="text-sm font-bold text-white">{liveBadgeToast.name}</p>
          </div>
        </div>
      )}

      <XPWindow
        title={`SYBORG Text Twist.exe${titleParts.length ? " — " + titleParts.join(" ") : " — Round"}`}
        className="max-w-3xl"
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {daily && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white
                         bg-gradient-to-b from-orange-400/70 to-orange-700/60 border border-orange-300/50
                         shadow-[0_0_10px_rgba(234,88,12,0.5)] uppercase tracking-widest"
            >
              📅 Daily Challenge
            </span>
          )}
          {technical && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white
                         bg-gradient-to-b from-teal-400/40 to-blue-600/30 border border-cyan-300/50
                         shadow-[0_0_10px_rgba(34,211,238,0.5)] uppercase tracking-widest"
            >
              ⚙ Technical — IT/CS Vocabulary
            </span>
          )}
          {abyssal && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white
                         bg-gradient-to-b from-rose-500/50 to-red-900/40 border border-rose-400/50
                         shadow-[0_0_10px_rgba(244,63,94,0.5)] uppercase tracking-widest"
            >
              ☠ Abyssal — 3 Strikes
            </span>
          )}
          {glitch && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white
                         bg-gradient-to-b from-fuchsia-500/50 to-purple-900/40 border border-fuchsia-300/50
                         shadow-[0_0_10px_rgba(217,70,239,0.5)] uppercase tracking-widest"
            >
              ⌁ Glitch
            </span>
          )}
          {blind && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white
                         bg-gradient-to-b from-amber-400/60 to-yellow-800/40 border border-amber-300/50
                         shadow-[0_0_10px_rgba(245,158,11,0.5)] uppercase tracking-widest"
            >
              ◐ Blind
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-sm font-bold">
          <div className="xp-inset px-3 py-1" style={{ color: "var(--xp-teal-dark)" }}>
            SCORE: {game.score}
          </div>
          <div className="xp-inset px-3 py-1" style={{ color: game.timeLeft <= 15 ? "#b91c1c" : "#111" }}>
            TIME: {game.timeLeft}s
          </div>
          <div className="xp-inset px-3 py-1">
            WORDS: {game.foundWords.length} / {game.puzzle.solutions.length}
          </div>
          {game.streak > 0 && (
            <div className="xp-inset px-3 py-1" style={{ color: "#7c3aed" }}>
              🔥 x{game.multiplier.toFixed(2)} streak
            </div>
          )}
          {game.secondWindReady && (
            <div className="xp-inset px-3 py-1" style={{ color: "#0891b2" }} title="Solve the full word to earn this — it auto-refills the clock once, right as time would run out">
              ⚡ Second Wind ready
            </div>
          )}
          {abyssal && (
            <div className="xp-inset px-3 py-1 tracking-wider">
              {Array.from({ length: game.maxLives }).map((_, i) => (
                <span key={i} style={{ color: i < game.lives ? "#dc2626" : "#d1d5db" }}>
                  ♥
                </span>
              ))}
            </div>
          )}
        </div>

        {game.status === "playing" && (
          <>
            <div className="xp-inset h-10 flex items-center justify-center text-xl tracking-[0.3em] font-black mb-4">
              {game.currentGuess.toUpperCase() || " "}
              {game.flash && (
                <span
                  className="ml-3 text-sm tracking-normal"
                  style={{ color: FLASH_COLORS[game.flash.kind] ?? "#111" }}
                >
                  {game.flash.text}
                </span>
              )}
            </div>

            <LetterTiles
              letters={game.letters}
              pickedIndices={game.pickedIndices}
              onPick={game.pickLetter}
              hidden={blind && game.lettersHidden}
              glitching={glitch && tileShake}
            />

            <div className="flex flex-wrap justify-center gap-2 my-4">
              <button className="xp-btn" onClick={game.submitGuess}>
                Enter
              </button>
              <button className="xp-btn" onClick={game.backspace}>
                ⌫ Back
              </button>
              <button className="xp-btn" onClick={game.clearGuess}>
                Clear
              </button>
              <button className="xp-btn" onClick={game.shuffleTiles}>
                🔀 Twist
              </button>
              <button
                className="xp-btn"
                onClick={game.useHint}
                disabled={game.score < game.hintCost}
                title={`Reveal one letter of the longest unsolved word (−${game.hintCost} pts)`}
              >
                💡 Hint (−{game.hintCost})
              </button>
            </div>

            <div className="xp-inset p-3">
              <SolutionSlots
                solutions={game.puzzle.solutions}
                foundWords={game.foundWords}
                hintedLetters={game.hintedLetters}
                glitchNumbers={glitch && game.numbersGlitching}
              />
            </div>
          </>
        )}

        {game.status === "finished" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <h2 className="text-2xl font-black" style={{ color: game.defeated ? "#b91c1c" : "var(--xp-teal-dark)" }}>
              {game.defeated ? "☠ OUT — 0 LIVES LEFT" : solvedAll ? "PERFECT ROUND!" : "TIME'S UP"}
            </h2>
            <p className="text-sm text-gray-700">
              Final score <strong>{game.score}</strong> — found {game.foundWords.length} of{" "}
              {game.puzzle.solutions.length} words. The full word was{" "}
              <strong>{game.puzzle.base.toUpperCase()}</strong>.
            </p>

            {game.missedWords.length > 0 && (
              <div className="flex flex-col items-center gap-2 xp-inset p-3 max-w-md">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--xp-teal-dark)" }}>
                  Words you missed
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {game.missedWords.map((w) => (
                    <span
                      key={w}
                      className="xp-inset px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                      style={{ color: "var(--xp-teal-dark)" }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {newBadges.length > 0 && (
              <div className="flex flex-col items-center gap-2 xp-inset p-3">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--xp-teal-dark)" }}>
                  🎉 Badge{newBadges.length > 1 ? "s" : ""} Unlocked
                </p>
                <div className="flex gap-3">
                  {newBadges.map((b) => (
                    <div key={b.id} className="flex flex-col items-center gap-1 w-20">
                      <BadgeIcon badge={b} size={36} />
                      <span className="text-[10px] font-bold text-center">{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!saved ? (
              pendingReplace ? (
                <div className="flex flex-col items-center gap-2 xp-inset p-3">
                  <p className="text-sm font-bold text-center">
                    "{pendingReplace.trimmed}" already has a score of {pendingReplace.score} in this mode.
                    <br />
                    Replace it with {game.score}?
                  </p>
                  <div className="flex gap-2">
                    <button className="xp-btn" onClick={confirmReplace}>
                      Yes, replace
                    </button>
                    <button className="xp-btn" onClick={cancelReplace}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="flex gap-2">
                  <input
                    className="xp-inset px-2 py-1"
                    placeholder="Your name"
                    maxLength={48}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <button type="submit" className="xp-btn">
                    Save Score
                  </button>
                </form>
              )
            ) : (
              <p className="text-sm font-bold" style={{ color: "var(--xp-green)" }}>
                Saved! Check the leaderboard.
              </p>
            )}

            <div className="flex gap-3 mt-2">
              <button className="xp-btn" onClick={game.newGame}>
                ▶ Play Again
              </button>
              <Link to="/leaderboard" className="xp-btn">
                🏆 Leaderboard
              </Link>
              <Link to="/" className="xp-btn">
                🏠 Home
              </Link>
            </div>
          </div>
        )}
      </XPWindow>
    </div>
  );
}
