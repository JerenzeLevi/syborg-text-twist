import words from "../data/words.json";
import techWords from "../data/techWords.json";

const WORD_SET = new Set(words);

// word -> category, for tagging any found word that happens to be IT/CS
// vocabulary, regardless of which mode generated the round.
const TECH_CATEGORY_BY_WORD = new Map(techWords.map((w) => [w.word, w.category]));

export function getWordCategory(word) {
  return TECH_CATEGORY_BY_WORD.get(word.toLowerCase()) ?? null;
}

// Words of exactly this length become the "base" of a puzzle — long enough
// to hide a satisfying number of sub-words, short enough to stay readable
// on a phone screen.
const BASE_LENGTHS = [5, 6];

// Technical Mode draws its base word only from IT/CS vocabulary, so every
// round scrambles a term a freshman would recognize from class — but still
// accepts any valid dictionary sub-word found inside it.
const TECH_BASE_LENGTHS = [5, 6, 7, 8];

const wordsByLength = new Map();
for (const w of words) {
  const list = wordsByLength.get(w.length) ?? [];
  list.push(w);
  wordsByLength.set(w.length, list);
}

const techWordsByLength = new Map();
for (const { word } of techWords) {
  const list = techWordsByLength.get(word.length) ?? [];
  list.push(word);
  techWordsByLength.set(word.length, list);
}

function letterCounts(word) {
  const counts = {};
  for (const ch of word) counts[ch] = (counts[ch] ?? 0) + 1;
  return counts;
}

function isSubAnagram(candidate, baseCounts) {
  const counts = { ...baseCounts };
  for (const ch of candidate) {
    if (!counts[ch]) return false;
    counts[ch] -= 1;
  }
  return true;
}

/** Finds every dictionary word (length 3..base.length) buildable from base's letters. */
function findSubWords(base) {
  const baseCounts = letterCounts(base);
  const found = [];
  for (let len = 3; len <= base.length; len++) {
    for (const candidate of wordsByLength.get(len) ?? []) {
      if (isSubAnagram(candidate, baseCounts)) found.push(candidate);
    }
  }
  return found.sort((a, b) => a.length - b.length || a.localeCompare(b));
}

function shuffle(str, rng = Math.random) {
  const arr = str.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

// Deterministic PRNG (mulberry32) so the Daily Challenge produces the exact
// same puzzle for every player who loads it on the same calendar day.
function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

/** Today's date in the Philippines (Asia/Manila), as YYYY-MM-DD. */
export function getManilaDateString() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

/**
 * Generates a puzzle: a scrambled base word plus every valid sub-word it
 * contains. Retries until the base yields a reasonable haul of words so
 * short/sparse bases (e.g. "aeiou"-heavy) don't produce a dud round.
 *
 * `daily: true` seeds the RNG from today's Manila date, so every player
 * gets the identical base word and scramble for a fair shared leaderboard.
 */
export function generatePuzzle({ minWords = 8, technical = false, daily = false } = {}) {
  const rng = daily ? mulberry32(hashString(`${getManilaDateString()}:${technical ? "tech" : "std"}`)) : Math.random;

  const lengths = technical ? TECH_BASE_LENGTHS : BASE_LENGTHS;
  const byLength = technical ? techWordsByLength : wordsByLength;
  const length = lengths[Math.floor(rng() * lengths.length)];
  const candidates = byLength.get(length) ?? [];

  // Technical Mode's pool is small, so a satisfying sub-word haul isn't
  // guaranteed — relax the requirement rather than looping forever.
  const effectiveMinWords = technical ? Math.min(minWords, 4) : minWords;

  for (let attempt = 0; attempt < 60; attempt++) {
    const base = candidates[Math.floor(rng() * candidates.length)];
    const solutions = findSubWords(base);
    if (solutions.length >= effectiveMinWords) {
      let scrambled = shuffle(base, rng);
      while (scrambled === base && base.length > 1) scrambled = shuffle(base, rng);
      return { base, scrambled, solutions };
    }
  }

  // Fallback: whatever the last attempt produced, so the game never hangs.
  const base = candidates[Math.floor(rng() * candidates.length)];
  return { base, scrambled: shuffle(base, rng), solutions: findSubWords(base) };
}

export function isValidWord(word) {
  return WORD_SET.has(word.toLowerCase());
}

export function scoreForWord(word) {
  // Longer finds are worth disproportionately more, same as classic Text Twist.
  if (word.length <= 3) return 10;
  if (word.length === 4) return 20;
  if (word.length === 5) return 40;
  if (word.length === 6) return 70;
  return word.length * 15;
}
