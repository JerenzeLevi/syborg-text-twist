const LEADERBOARD_KEY = "syborg-texttwist:leaderboard";
const STORE_CAP = 200; // total entries kept across all modes, trimmed by score

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently
  }
}

/**
 * `filterMode` — omit/"all" for everything; "classic" for pure classic rounds
 * only; any other key (e.g. "technical", "abyssal", "daily", "glitch",
 * "blind") matches that flag whether played alone or combined with others,
 * so filtering "technical" also surfaces "technical+abyssal" rounds.
 */
export function filterEntriesByMode(entries, filterMode = "all") {
  const filtered =
    filterMode === "all"
      ? entries
      : entries.filter((entry) => {
          const mode = entry.mode ?? "classic";
          return filterMode === "classic" ? mode === "classic" : mode.split("+").includes(filterMode);
        });
  return filtered.sort((a, b) => b.score - a.score).slice(0, 10);
}

export function getLeaderboard(filterMode = "all") {
  return filterEntriesByMode(read(LEADERBOARD_KEY, []), filterMode);
}

/**
 * Same name (case/whitespace-insensitive) + same mode already on the board?
 * Returns the lowest-scoring match — the one a replace would evict — or null.
 */
export function findLowestEntryForName(name, mode) {
  const norm = (name ?? "").trim().toLowerCase();
  if (!norm) return null;
  const list = read(LEADERBOARD_KEY, []);
  const matches = list.filter(
    (e) => (e.name ?? "").trim().toLowerCase() === norm && (e.mode ?? "classic") === mode
  );
  if (!matches.length) return null;
  return matches.reduce((min, e) => (e.score < min.score ? e : min));
}

export function removeLeaderboardEntry(id) {
  const list = read(LEADERBOARD_KEY, []);
  write(LEADERBOARD_KEY, list.filter((e) => e.id !== id));
}

export function addLeaderboardEntry(entry) {
  const list = read(LEADERBOARD_KEY, []);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  list.push({ ...entry, id, mode: entry.mode ?? "classic", date: new Date().toISOString() });
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, STORE_CAP);
  write(LEADERBOARD_KEY, trimmed);
  return id;
}

// A permanent "score to beat" entry — always present so there's a #1 for
// anyone else to either land just under (#2) or overtake (#1) at least once.
const SEED_ID = "seed-apex-omandam";

export function ensureLeaderboardSeed() {
  const list = read(LEADERBOARD_KEY, []);
  if (list.some((e) => e.id === SEED_ID)) return;
  list.push({
    id: SEED_ID,
    name: "Jerenze Levi Omandam",
    score: 67911143,
    wordsFound: 42,
    mode: "classic",
    date: new Date().toISOString(),
  });
  list.sort((a, b) => b.score - a.score);
  write(LEADERBOARD_KEY, list.slice(0, STORE_CAP));
}

/** 1-based rank of an entry across the whole leaderboard, any mode. Null if not found. */
export function getGlobalRank(entryId) {
  const list = read(LEADERBOARD_KEY, [])
    .slice()
    .sort((a, b) => b.score - a.score);
  const idx = list.findIndex((e) => e.id === entryId);
  return idx === -1 ? null : idx + 1;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isNextDay(prevDateStr, currentDateStr) {
  const prev = new Date(`${prevDateStr}T00:00:00Z`);
  const curr = new Date(`${currentDateStr}T00:00:00Z`);
  return Math.round((curr - prev) / 86400000) === 1;
}

function streakKey(name) {
  return `syborg-texttwist:daily-streak:${name.trim().toLowerCase()}`;
}

/**
 * Call once per completed Daily round. Increments the player's consecutive-day
 * streak (tracked per-name in this browser, since Daily rounds share a puzzle
 * per calendar day but there's no login to key streaks on).
 */
export function recordDailyStreak(name) {
  const key = streakKey(name);
  const today = todayKey();
  const prev = read(key, null);
  let streak = 1;
  if (prev) {
    if (prev.lastDate === today) streak = prev.streak;
    else if (isNextDay(prev.lastDate, today)) streak = prev.streak + 1;
  }
  write(key, { lastDate: today, streak });
  return streak;
}

/** Current streak for display, without recording a new play. 0 if it's lapsed. */
export function getDailyStreak(name) {
  const record = read(streakKey(name), null);
  if (!record) return 0;
  const today = todayKey();
  return record.lastDate === today || isNextDay(record.lastDate, today) ? record.streak : 0;
}
