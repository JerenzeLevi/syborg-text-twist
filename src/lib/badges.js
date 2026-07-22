import { BADGES } from "../data/badges.js";
import { getWordCategory } from "./wordGame.js";

const STATS_KEY = "syborg-texttwist:badge-stats";
const UNLOCKED_KEY = "syborg-texttwist:badges-unlocked";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function getStats() {
  return readJSON(STATS_KEY, {
    techWordsFound: 0,
    dailyDatesPlayed: [],
    consecutivePerfect: 0,
    allModesRounds: 0,
    consecutiveTwist: 0,
    consecutiveNoWindUsed: 0,
    consecutiveNoHint: 0,
  });
}

// Case/whitespace-insensitive — never compared or logged in plaintext elsewhere.
const SECRET_ADMIRER_NAME = "sarah gutierez giamat";
const THE_KING_NAME = "jerenze levi tinguha omandam";

export function getUnlockedBadgeIds() {
  return readJSON(UNLOCKED_KEY, []);
}

function unlock(id, unlocked) {
  if (unlocked.includes(id)) return false;
  unlocked.push(id);
  return true;
}

function findBadge(id) {
  return BADGES.find((b) => b.id === id);
}

/** Manual, one-off unlocks that aren't tied to a round result. Returns the
 * badge if this call newly unlocked it, otherwise null. */
function unlockManual(id) {
  const unlocked = getUnlockedBadgeIds();
  if (!unlock(id, unlocked)) return null;
  writeJSON(UNLOCKED_KEY, unlocked);
  return findBadge(id);
}

/** Triggered from the About page's 7-click logo easter egg. */
export function unlockEasterEggBadge() {
  return unlockManual("easter-egg");
}

/** Triggered when the player clicks "Follow on GitHub" — honor-system, same
 * as any social-follow prompt without OAuth to verify against. */
export function unlockGithubFollowBadge() {
  return unlockManual("github-follower");
}

/** Triggered when the player saves their score under a particular name. */
export function unlockSecretAdmirerBadge(name) {
  if ((name ?? "").trim().toLowerCase() !== SECRET_ADMIRER_NAME) return null;
  return unlockManual("secret-admirer");
}

/** Triggered when the player saves their score under a particular name. */
export function unlockTheKingBadge(name) {
  if ((name ?? "").trim().toLowerCase() !== THE_KING_NAME) return null;
  return unlockManual("the-king");
}

/** Triggered from Taskbar when the music button is clicked rapidly. */
export function unlockAnnoyingBadge() {
  return unlockManual("i-hate-you");
}

/** Triggered when a round-in-progress clears every word in under 5s. */
export function unlockBroSpeedBadge() {
  return unlockManual("bro-speed");
}

/** Triggered when 20 round-clears in a row land inside a 2-minute window. */
export function unlockSpeedrunChainBadge() {
  return unlockManual("speedrun-chain");
}

/** Triggered when a round is cleared with under 3 seconds left on the clock. */
export function unlockAmbulanceBadge() {
  return unlockManual("call-ambulance");
}

/** Triggered right after saving a score that lands at global rank #2. */
export function unlockKingBelowApexBadge() {
  return unlockManual("king-below-apex");
}

/** Triggered right after saving a score that lands at global rank #1. */
export function unlockHackerBadge() {
  return unlockManual("hacker");
}

/**
 * Called once when a round ends. Evaluates every badge condition against
 * this round's result plus cumulative stats, unlocking any newly earned
 * badges. Returns the list of badge ids newly unlocked this call.
 */
export function recordRoundResult({
  foundWords,
  solutions,
  base,
  technical,
  abyssal,
  daily,
  glitch,
  blind,
  defeated,
  multiplier,
  secondWindUsed,
  hintUsedThisRound,
}) {
  const stats = getStats();
  const unlocked = getUnlockedBadgeIds();
  const newlyUnlocked = [];

  const techFoundThisRound = foundWords.filter((w) => getWordCategory(w)).length;
  stats.techWordsFound += techFoundThisRound;

  if (daily) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
    if (!stats.dailyDatesPlayed.includes(today)) stats.dailyDatesPlayed.push(today);
  }

  const isPerfect = foundWords.length === solutions.length && solutions.length > 0;
  stats.consecutivePerfect = isPerfect ? (stats.consecutivePerfect ?? 0) + 1 : 0;

  const allModesActive = technical && abyssal && glitch && blind;
  if (allModesActive) stats.allModesRounds = (stats.allModesRounds ?? 0) + 1;

  const twistAchieved = foundWords.includes(base);
  stats.consecutiveTwist = twistAchieved ? (stats.consecutiveTwist ?? 0) + 1 : 0;
  stats.consecutiveNoWindUsed = !secondWindUsed ? (stats.consecutiveNoWindUsed ?? 0) + 1 : 0;
  stats.consecutiveNoHint = !hintUsedThisRound ? (stats.consecutiveNoHint ?? 0) + 1 : 0;

  const checks = [
    ["first-twist", foundWords.includes(base)],
    ["perfect-round", isPerfect],
    ["cyber-novice", stats.techWordsFound >= 10],
    ["abyssal-survivor", abyssal && !defeated],
    ["daily-devotee", stats.dailyDatesPlayed.length >= 3],
    ["streak-master", multiplier >= 2.5],
    ["glitch-tolerant", glitch && !defeated],
    ["blind-faith", blind && !defeated],
    ["master-of-all", stats.consecutivePerfect >= 30],
    ["expert-of-all", stats.allModesRounds >= 10],
    ["skill-issue", foundWords.length === 0],
    ["master-of-wind", stats.consecutiveTwist >= 20],
    ["wind-immunity", stats.consecutiveNoWindUsed >= 10],
    ["hintless", stats.consecutiveNoHint >= 5],
  ];

  for (const [id, condition] of checks) {
    if (condition && unlock(id, unlocked)) newlyUnlocked.push(id);
  }

  writeJSON(STATS_KEY, stats);
  writeJSON(UNLOCKED_KEY, unlocked);
  return newlyUnlocked.map((id) => findBadge(id));
}

export function listBadgesWithStatus() {
  const unlocked = new Set(getUnlockedBadgeIds());
  return BADGES.map((b) => ({ ...b, unlocked: unlocked.has(b.id) }));
}
