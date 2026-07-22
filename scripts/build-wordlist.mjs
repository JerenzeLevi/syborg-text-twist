// One-off build step: filters the bundled English word list down to plain
// lowercase words of length 3-6 (Text Twist's playable range) and writes a
// compact JSON array used at runtime for both puzzle generation and word
// validation. Re-run with `node scripts/build-wordlist.mjs` if the source
// dictionary dependency is ever upgraded.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const words = require("an-array-of-english-words");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filtered = [...new Set(
  words.filter((w) => /^[a-z]{3,6}$/.test(w))
)].sort();

const outPath = path.join(__dirname, "..", "src", "data", "words.json");
writeFileSync(outPath, JSON.stringify(filtered));

console.log(`Wrote ${filtered.length} words to ${outPath}`);
