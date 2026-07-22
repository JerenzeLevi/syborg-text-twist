import { useEffect, useState } from "react";
import { getWordCategory } from "../lib/wordGame.js";

// How often the fake bubble number re-rolls while Glitch Mode is scrambling it.
const GLITCH_NUMBER_FLICKER_MS = 350;

function fakeNumberFor(length) {
  // Stay plausible-but-wrong: never show the real length.
  let fake = length;
  while (fake === length) {
    fake = 1 + Math.floor(Math.random() * 9);
  }
  return fake;
}

export default function SolutionSlots({ solutions, foundWords, hintedLetters = {}, glitchNumbers = false }) {
  const [flicker, setFlicker] = useState(0);

  useEffect(() => {
    if (!glitchNumbers) return undefined;
    const id = setInterval(() => setFlicker((n) => n + 1), GLITCH_NUMBER_FLICKER_MS);
    return () => clearInterval(id);
  }, [glitchNumbers]);

  const byLength = new Map();
  for (const word of solutions) {
    const list = byLength.get(word.length) ?? [];
    list.push(word);
    byLength.set(word.length, list);
  }

  return (
    <div className="flex flex-col gap-3">
      {[...byLength.entries()].map(([length, words]) => (
        <div key={length} className="flex flex-wrap gap-2">
          {words.map((word) => {
            const found = foundWords.includes(word);
            const category = found ? getWordCategory(word) : null;
            const revealedCount = hintedLetters[word] ?? 0;
            // Glitching: badge and dot count must lie together, or counting dots
            // gives away the real length even with a fake badge number. Never
            // fake below the letters already revealed by a hint.
            const displayLength =
              glitchNumbers && !found ? Math.max(fakeNumberFor(length), revealedCount) : length;
            return (
              <div
                key={word}
                className="relative flex flex-col items-center justify-center min-h-11 px-3 py-1 rounded-2xl
                           bg-gradient-to-b from-teal-500 to-blue-600
                           border border-cyan-200/70
                           shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_2px_6px_rgba(0,50,80,0.35)]
                           transition-all duration-300 hover:scale-[1.02]"
                style={{ minWidth: `${length * 1.1}rem` }}
              >
                {!found && (
                  <span
                    key={glitchNumbers ? flicker : "stable"}
                    className={`absolute -top-1.5 -right-1.5 flex items-center justify-center px-1.5 py-0.5
                               text-[9px] font-mono font-bold text-white rounded-full
                               shadow-[0_0_8px_#22d3ee] scale-90 ${
                                 glitchNumbers
                                   ? "bg-fuchsia-600 animate-pulse"
                                   : "bg-cyan-500 animate-pulse"
                               }`}
                  >
                    {displayLength}
                  </span>
                )}

                <div
                  key={glitchNumbers ? `dots-${flicker}` : "dots-stable"}
                  className="flex gap-1 justify-center items-center tracking-widest font-mono text-sm font-bold h-6"
                >
                  {found ? (
                    <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] uppercase">
                      {word}
                    </span>
                  ) : (
                    Array.from({ length: displayLength }).map((_, idx) =>
                      idx < revealedCount ? (
                        <span key={idx} className="text-white/90 uppercase text-xs">
                          {word[idx]}
                        </span>
                      ) : (
                        <span
                          key={idx}
                          className="w-2.5 h-2.5 rounded-full bg-white/70 border border-white/80 shadow-inner"
                        />
                      )
                    )
                  )}
                </div>

                {category && (
                  <span className="text-[8px] font-mono text-cyan-100/90 uppercase tracking-wider mt-0.5">
                    {category}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
