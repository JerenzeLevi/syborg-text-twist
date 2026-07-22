import XPWindow from "../components/XPWindow.jsx";

export default function RulesPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <XPWindow title="SYBORG Text Twist.exe — Rules" className="max-w-3xl">
        <div className="space-y-5 text-sm text-gray-800 max-h-[75vh] overflow-y-auto pr-2">
          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: "var(--xp-teal-dark)" }}>
              Goal
            </h2>
            <p>
              Each round scrambles a hidden base word. Tap letter tiles to spell any real word of 3+ letters
              hidden inside it, then hit <strong>Enter</strong>. Find as many sub-words as you can before time
              runs out — finding a word the same length as the full base word is the biggest prize of the round.
            </p>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: "var(--xp-teal-dark)" }}>
              Controls
            </h2>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Click tiles (or type letters on your keyboard) to build a guess</li>
              <li><strong>Enter</strong> — submit the current guess</li>
              <li><strong>⌫ Back</strong> — remove the last letter</li>
              <li><strong>Clear</strong> — wipe the current guess</li>
              <li><strong>🔀 Twist</strong> — reshuffle the tiles</li>
              <li><strong>💡 Hint</strong> — reveals the first letter of the longest unsolved word (costs 25 points)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: "var(--xp-teal-dark)" }}>
              Scoring
            </h2>
            <ul className="list-disc list-inside space-y-0.5">
              <li>3-letter word: 10 pts · 4-letter: 20 pts · 5-letter: 40 pts · 6-letter: 70 pts · 7+ letters: 15 pts per letter</li>
              <li>Every correct word also adds a few seconds to the clock (longer words add more)</li>
              <li>Back-to-back correct words build a streak multiplier (up to 2.5x) — a wrong guess resets it</li>
              <li>Solving the full base word banks a one-time "Second Wind": the clock auto-refills to 120s the instant it would otherwise hit zero</li>
              <li>Hints cost 25 points each and only work if you can afford one</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: "var(--xp-teal-dark)" }}>
              Timing &amp; penalties
            </h2>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Every round starts with 120 seconds on the clock</li>
              <li>Guessing a real dictionary word that isn't in this round's letter set: −3 seconds</li>
              <li>Guessing something that isn't a real word at all: −10 seconds</li>
              <li>Re-submitting a word you already found does nothing (no penalty, but no points either)</li>
              <li>Clearing every word in the round advances you straight to a fresh puzzle, carrying your score, time, and streak forward — Daily Challenge stays on its one shared puzzle instead</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: "var(--xp-teal-dark)" }}>
              Modes (combinable via toggles on Home)
            </h2>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>📅 Daily Challenge</strong> — everyone gets the same puzzle for the day (Manila time), for a fair leaderboard comparison</li>
              <li><strong>⚙ Technical</strong> — the base word is always IT/CS/BLIS/BSIS vocabulary</li>
              <li><strong>☠ Abyssal</strong> — you get 3 lives; a wrong guess costs a life and 0 lives ends the round immediately</li>
              <li><strong>⌁ Glitch</strong> — the tile row jolts and the word-length bubbles scramble into fake numbers on a timer</li>
              <li><strong>◐ Blind</strong> — tiles blur from memory after a few seconds, with periodic full blackouts</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: "var(--xp-teal-dark)" }}>
              Badges
            </h2>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Master of Wind</strong> — bank Second Wind (find the full base word) in 20 rounds in a row</li>
              <li><strong>Wind Immunity</strong> — finish 10 rounds in a row without ever needing Second Wind</li>
              <li><strong>Hintless</strong> — finish 5 rounds in a row without using a hint</li>
              <li><strong>Bro thinks s/he's speed</strong> — clear every word in a round in under 5 seconds</li>
              <li><strong>Speedrun!</strong> — clear 20 rounds in a row within 2 minutes total</li>
              <li><strong>Call ambulance but not for me</strong> — clear a round with under 3 seconds left</li>
              <li><strong>King below The Apex; Levi</strong> / <strong>W-w-what a hacker!</strong> — land at #2 or #1 on the leaderboard, any mode</li>
              <li>A few other badges are secrets — you'll know when you've found one</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black uppercase tracking-widest text-xs mb-1" style={{ color: "var(--xp-teal-dark)" }}>
              Leaderboard
            </h2>
            <p>
              After a round ends, save your score under a name. Scores are tracked separately per mode
              combination, and using the same name in the same mode again offers to replace your lower score.
            </p>
          </section>
        </div>
      </XPWindow>
    </div>
  );
}
