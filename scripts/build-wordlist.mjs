// One-off build step: filters the bundled English word list down to plain
// lowercase words of length 3-6 (Text Twist's playable range), then keeps
// only entries that also appear in a top-10k word-frequency list. Without
// that second filter, the raw dictionary is full of obscure Scrabble-only
// words (e.g. "aal", "aby", "ait") that no casual player would recognize —
// real Text Twist doesn't use those either. Writes a compact JSON array used
// at runtime for both puzzle generation and word validation. Re-run with
// `node scripts/build-wordlist.mjs` if either source dependency is upgraded.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const words = require("an-array-of-english-words");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const freqListPath = require.resolve(
  "most-common-words-by-language/build/resources/english.txt"
);
const commonWords = new Set(
  readFileSync(freqListPath, "utf8").split(/\r?\n/).filter(Boolean)
);

const filtered = [...new Set(
  words.filter((w) => /^[a-z]{3,6}$/.test(w) && commonWords.has(w))
)].sort();

const outPath = path.join(__dirname, "..", "src", "data", "words.json");
writeFileSync(outPath, JSON.stringify(filtered));

console.log(`Wrote ${filtered.length} words to ${outPath}`);
