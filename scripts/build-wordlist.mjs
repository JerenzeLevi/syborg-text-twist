// One-off build step: assembles the playable word list (length 3-8, matching
// the longest base word the game ever generates — see TECH_BASE_LENGTHS in
// src/lib/wordGame.js) from a common-English-word corpus, then folds in the
// curated technical vocabulary so every technical term is guessable both as
// a sub-word and as the round's final/base word. Profanity is stripped, and
// a short exclusion list keeps brand/product names (which aren't standard
// dictionary words) out of the *validation* set even though they still work
// fine as technical-mode base words. Writes a compact JSON array used at
// runtime for both puzzle generation and word validation. Re-run with
// `node scripts/build-wordlist.mjs` if any source dependency is upgraded.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// wordlist-english ships SCOWL frequency tiers as separate, non-overlapping
// files (each tier is a delta, not cumulative) — union tiers 10/20/35/40 to
// get "words a normal English speaker recognizes" without pulling in SCOWL's
// more obscure/archaic tiers (55+), which is where words like "aal"/"aby"
// live.
const SCOWL_TIERS = [10, 20, 35, 40];
const commonWords = new Set();
for (const tier of SCOWL_TIERS) {
  for (const w of require(`wordlist-english/english-words-${tier}.json`)) {
    commonWords.add(w);
  }
}

const { array: badWords } = require("badwords-list");
const BLOCKED = new Set(badWords.map((w) => w.toLowerCase()));

const techWordsPath = path.join(__dirname, "..", "src", "data", "techWords.json");
const techWords = JSON.parse(readFileSync(techWordsPath, "utf8")).map((w) => w.word);

// Real product/brand names used as Technical Mode base words but not
// standard English dictionary entries — kept out of the guessable/validation
// word list per "only add it if it's a standard noun/verb/adj, not a name."
const PROPER_NOUN_EXCLUSIONS = new Set(["pixar", "indesign", "lightroom"]);

const isPlayable = (w) => /^[a-z]{3,8}$/.test(w);

const filtered = new Set(
  [...commonWords].filter((w) => isPlayable(w) && !BLOCKED.has(w))
);

for (const w of techWords) {
  if (isPlayable(w) && !PROPER_NOUN_EXCLUSIONS.has(w) && !BLOCKED.has(w)) {
    filtered.add(w);
  }
}

const outPath = path.join(__dirname, "..", "src", "data", "words.json");
writeFileSync(outPath, JSON.stringify([...filtered].sort()));

console.log(`Wrote ${filtered.size} words to ${outPath}`);
