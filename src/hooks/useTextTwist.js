import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle, getWordCategory, isValidWord, scoreForWord } from "../lib/wordGame.js";
import {
  playBlindWarning,
  playCorrect,
  playHint,
  playLifeLost,
  playTwist,
  playWrong,
} from "../lib/sound.js";

const ROUND_SECONDS = 120;
const SPEEDRUN_CLEAR_MS = 5000; // clearing every word in a round this fast earns "Bro thinks s/he's speed"
const SPEEDRUN_CHAIN_WINDOW_MS = 120000; // 20 consecutive round-clears inside this window earns "Speedrun!"
const SPEEDRUN_CHAIN_COUNT = 20;
const AMBULANCE_TIME_LEFT = 3; // clearing a round with less than this much time left earns "Call ambulance but not for me"
const ABYSSAL_LIVES = 3;
const HINT_COST = 25;
const NOT_REAL_WORD_PENALTY_SECONDS = 10;
const NEAR_MISS_PENALTY_SECONDS = 3;
const timeBonusForWord = (word) => (word.length >= 5 ? 5 : word.length === 4 ? 3 : 2);
const MAX_STREAK_BONUS = 2.5; // multiplier cap so long streaks don't blow out scoring
const BLIND_REVEAL_MS = 3500; // how long tiles stay legible before Blind Mode blurs them

// Blind Mode: periodic full blackout on top of the tile blur, forcing players
// to work from memory in short bursts.
const BLIND_BLACKOUT_MS = 3000;
const BLIND_VISIBLE_MS = 10000;
// How long before a blackout the warning cue (pulse + tone) fires, so it
// reads as a countdown rather than a jump-scare.
const BLIND_WARNING_LEAD_MS = 2000;

// Glitch Mode: the word-length bubbles below the tiles scramble into fake
// numbers, then settle back so players can re-orient.
const GLITCH_NUMBERS_MS = 15000;
const GLITCH_NORMAL_MS = 5000;

// When both modes are active, guarantee one calm stretch per cycle before
// either effect kicks in, so the two don't compound into an unplayable mess.
const COMBINED_NORMAL_MS = 10000;

export function useTextTwist({
  technical = false,
  abyssal = false,
  daily = false,
  glitch = false,
  blind = false,
} = {}) {
  const [puzzle, setPuzzle] = useState(() => generatePuzzle({ technical, daily }));
  const [letters, setLetters] = useState(() => puzzle.scrambled.split(""));
  const [pickedIndices, setPickedIndices] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [status, setStatus] = useState("playing"); // playing | finished
  const [lives, setLives] = useState(ABYSSAL_LIVES);
  const [defeated, setDefeated] = useState(false); // true only when abyssal lives hit 0
  const [streak, setStreak] = useState(0);
  // "Second Wind" — solving the round's full base word (the hardest single
  // find, far more attainable than clearing every sub-word) banks one clock
  // refill, spent automatically the instant time would otherwise run out.
  const [secondWindReady, setSecondWindReady] = useState(false);
  const [secondWindUsed, setSecondWindUsed] = useState(false);
  const [hintedLetters, setHintedLetters] = useState({}); // word -> revealed prefix length
  const [lettersHidden, setLettersHidden] = useState(false); // Blind Mode: tiles blurred from memory
  const [blackout, setBlackout] = useState(false); // Blind Mode: periodic full black screen
  const [blindWarning, setBlindWarning] = useState(false); // Blind Mode: pulse cue just before blackout
  const [numbersGlitching, setNumbersGlitching] = useState(false); // Glitch Mode: fake bubble numbers
  const [flash, setFlash] = useState(null); // { kind: 'good'|'bad'|'twist'|'near'|'hint', text }
  const [hintUsedThisRound, setHintUsedThisRound] = useState(false);
  const [puzzleClearEvent, setPuzzleClearEvent] = useState(null); // { elapsedMs, timeLeftAtClear, chainFast, ts }
  const flashTimeout = useRef(null);
  const puzzleStartRef = useRef(Date.now());
  const clearTimestampsRef = useRef([]);

  // Every puzzle (fresh round or auto-advanced next one) restarts the clock
  // used to detect "cleared this fast" speedrun badges.
  useEffect(() => {
    puzzleStartRef.current = Date.now();
  }, [puzzle]);

  // Blind Mode: show tiles briefly after every reshuffle, then blur them —
  // the player has to remember where each letter was.
  useEffect(() => {
    if (!blind) {
      setLettersHidden(false);
      return undefined;
    }
    setLettersHidden(false);
    const id = setTimeout(() => setLettersHidden(true), BLIND_REVEAL_MS);
    return () => clearTimeout(id);
  }, [blind, letters]);

  // Blind Mode blackout blink + Glitch Mode bubble-number scramble, run on
  // their own repeating cycles. When both modes are on, they share a cycle
  // with a guaranteed calm stretch first so the effects don't stack.
  useEffect(() => {
    if (!blind && !glitch) {
      setBlackout(false);
      setBlindWarning(false);
      setNumbersGlitching(false);
      return undefined;
    }

    let cancelled = false;
    const timers = [];
    const schedule = (fn, ms) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };

    if (blind && glitch) {
      const runCycle = () => {
        setBlackout(false);
        setBlindWarning(false);
        setNumbersGlitching(false);
        schedule(() => {
          setBlindWarning(true);
          playBlindWarning();
        }, Math.max(COMBINED_NORMAL_MS - BLIND_WARNING_LEAD_MS, 0));
        schedule(() => {
          setBlindWarning(false);
          setBlackout(true);
          schedule(() => {
            setBlackout(false);
            setNumbersGlitching(true);
            schedule(() => {
              setNumbersGlitching(false);
              runCycle();
            }, GLITCH_NUMBERS_MS);
          }, BLIND_BLACKOUT_MS);
        }, COMBINED_NORMAL_MS);
      };
      runCycle();
    } else if (blind) {
      const runCycle = () => {
        setBlackout(false);
        setBlindWarning(false);
        schedule(() => {
          setBlindWarning(true);
          playBlindWarning();
        }, Math.max(BLIND_VISIBLE_MS - BLIND_WARNING_LEAD_MS, 0));
        schedule(() => {
          setBlindWarning(false);
          setBlackout(true);
          schedule(() => {
            setBlackout(false);
            runCycle();
          }, BLIND_BLACKOUT_MS);
        }, BLIND_VISIBLE_MS);
      };
      runCycle();
    } else if (glitch) {
      const runCycle = () => {
        setNumbersGlitching(true);
        schedule(() => {
          setNumbersGlitching(false);
          schedule(runCycle, GLITCH_NORMAL_MS);
        }, GLITCH_NUMBERS_MS);
      };
      runCycle();
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [blind, glitch]);

  useEffect(() => {
    if (status !== "playing") return undefined;
    if (timeLeft <= 0) {
      if (secondWindReady) {
        setSecondWindReady(false);
        setSecondWindUsed(true);
        setTimeLeft(ROUND_SECONDS);
        showFlash("twist", `⚡ SECOND WIND — +${ROUND_SECONDS}s!`);
        return undefined;
      }
      setStatus("finished");
      return undefined;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, timeLeft, secondWindReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentGuess = useMemo(
    () => pickedIndices.map((i) => letters[i]).join(""),
    [pickedIndices, letters]
  );

  const missedWords = useMemo(
    () => puzzle.solutions.filter((w) => !foundWords.includes(w)),
    [puzzle, foundWords]
  );

  const multiplier = useMemo(() => Math.min(1 + streak * 0.15, MAX_STREAK_BONUS), [streak]);

  const showFlash = useCallback((kind, text) => {
    clearTimeout(flashTimeout.current);
    setFlash({ kind, text });
    // Hints carry information the player still needs a moment later — give
    // them noticeably longer on screen than a plain correct/wrong flash.
    flashTimeout.current = setTimeout(() => setFlash(null), kind === "hint" ? 4000 : 1100);
  }, []);

  const pickLetter = useCallback(
    (index) => {
      if (status !== "playing") return;
      setPickedIndices((prev) => (prev.includes(index) ? prev : [...prev, index]));
    },
    [status]
  );

  const backspace = useCallback(() => {
    setPickedIndices((prev) => prev.slice(0, -1));
  }, []);

  const clearGuess = useCallback(() => setPickedIndices([]), []);

  const shuffleTiles = useCallback(() => {
    setLetters((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
    setPickedIndices([]);
  }, []);

  const submitGuess = useCallback(() => {
    if (status !== "playing" || currentGuess.length < 3) return;
    const word = currentGuess.toLowerCase();

    if (foundWords.includes(word)) {
      showFlash("bad", "already found");
      setPickedIndices([]);
      return;
    }

    const inThisRound = puzzle.solutions.includes(word);
    if (!inThisRound || !isValidWord(word)) {
      setPickedIndices([]);
      setStreak(0);
      playWrong();

      // A "near miss" is a real dictionary word that just isn't part of
      // this round's letter set — worth telling apart from pure gibberish.
      const nearMiss = !inThisRound && isValidWord(word);
      const penaltySeconds = nearMiss ? NEAR_MISS_PENALTY_SECONDS : NOT_REAL_WORD_PENALTY_SECONDS;
      const missText = `${nearMiss ? "real word — not in this round" : "not a real word"} · −${penaltySeconds}s`;
      setTimeLeft((prev) => Math.max(prev - penaltySeconds, 0));

      if (abyssal) {
        setLives((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setStatus("finished");
            setDefeated(true);
            playLifeLost();
            showFlash("bad", "OUT — 0 lives left");
          } else {
            playLifeLost();
            showFlash(nearMiss ? "near" : "bad", `${missText} — ${next} ${next === 1 ? "life" : "lives"} left`);
          }
          return Math.max(next, 0);
        });
      } else {
        showFlash(nearMiss ? "near" : "bad", missText);
      }
      return;
    }

    const category = getWordCategory(word);
    const base = scoreForWord(word);
    const gained = Math.round(base * multiplier);
    const nextFoundWords = [...foundWords, word];
    setFoundWords(nextFoundWords);
    setScore((prev) => prev + gained);
    setPickedIndices([]);
    setStreak((prev) => prev + 1);
    const nextTimeLeft = Math.min(timeLeft + timeBonusForWord(word), ROUND_SECONDS);
    setTimeLeft(nextTimeLeft);

    if (nextFoundWords.length === puzzle.solutions.length) {
      const elapsedMs = Date.now() - puzzleStartRef.current;
      const timestamps = clearTimestampsRef.current;
      timestamps.push(Date.now());
      const chainFast =
        timestamps.length >= SPEEDRUN_CHAIN_COUNT &&
        timestamps[timestamps.length - 1] - timestamps[timestamps.length - SPEEDRUN_CHAIN_COUNT] <=
          SPEEDRUN_CHAIN_WINDOW_MS;
      setPuzzleClearEvent({
        elapsedMs,
        timeLeftAtClear: nextTimeLeft,
        fast: elapsedMs <= SPEEDRUN_CLEAR_MS,
        tooClose: nextTimeLeft < AMBULANCE_TIME_LEFT,
        chainFast,
        ts: Date.now(),
      });
    }

    const isTwist = word.length === puzzle.base.length;
    if (isTwist) {
      playTwist();
      if (!secondWindUsed) setSecondWindReady(true);
    } else {
      playCorrect();
    }

    const tag = category ? ` · ${category}` : "";
    const windTag = isTwist && !secondWindUsed ? " · ⚡ Second Wind banked!" : "";
    showFlash(isTwist ? "twist" : "good", `+${gained}${tag} · +${timeBonusForWord(word)}s${windTag}`);
  }, [status, currentGuess, foundWords, puzzle, showFlash, abyssal, multiplier, secondWindUsed, timeLeft]);

  // Solved every word in the round — advance to a fresh puzzle instead of
  // idling out the clock, carrying score/streak forward (classic Text Twist
  // "next round" behavior). The clock and Second Wind are per-round state,
  // so both reset on a clear: a full 120s and a fresh shot at banking Second
  // Wind again (the "Wind Immunity" badge tracks rounds cleared without ever
  // needing it, so an unused bank still counts toward that streak). Daily
  // rounds stay on their single shared puzzle so the leaderboard comparison
  // remains fair.
  useEffect(() => {
    if (status !== "playing" || daily) return;
    if (foundWords.length === 0 || foundWords.length < puzzle.solutions.length) return;
    const next = generatePuzzle({ technical, daily });
    setPuzzle(next);
    setLetters(next.scrambled.split(""));
    setPickedIndices([]);
    setFoundWords([]);
    setHintedLetters({});
    setTimeLeft(ROUND_SECONDS);
    setSecondWindReady(false);
    setSecondWindUsed(false);
  }, [foundWords, puzzle, status, technical, daily]);

  const useHint = useCallback(() => {
    if (status !== "playing" || score < HINT_COST) return;
    const unsolved = puzzle.solutions
      .filter((w) => !foundWords.includes(w))
      .sort((a, b) => b.length - a.length);
    const target = unsolved.find((w) => (hintedLetters[w] ?? 0) < w.length);
    if (!target) return;

    setScore((prev) => prev - HINT_COST);
    setHintedLetters((prev) => ({ ...prev, [target]: (prev[target] ?? 0) + 1 }));
    setHintUsedThisRound(true);
    playHint();
    showFlash("hint", `hint: "${target[0].toUpperCase()}..." (${target.length} letters) −${HINT_COST}`);
  }, [status, score, puzzle, foundWords, hintedLetters, showFlash]);

  const newGame = useCallback(() => {
    const next = generatePuzzle({ technical, daily });
    setPuzzle(next);
    setLetters(next.scrambled.split(""));
    setPickedIndices([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setLives(ABYSSAL_LIVES);
    setDefeated(false);
    setStreak(0);
    setHintedLetters({});
    setStatus("playing");
    setFlash(null);
    setSecondWindReady(false);
    setSecondWindUsed(false);
    setHintUsedThisRound(false);
    setPuzzleClearEvent(null);
    clearTimestampsRef.current = [];
  }, [technical, daily]);

  return {
    puzzle,
    missedWords,
    secondWindReady,
    secondWindUsed,
    technical,
    abyssal,
    daily,
    glitch,
    blind,
    lettersHidden,
    blackout,
    blindWarning,
    numbersGlitching,
    letters,
    pickedIndices,
    currentGuess,
    foundWords,
    score,
    timeLeft,
    roundSeconds: ROUND_SECONDS,
    lives,
    maxLives: ABYSSAL_LIVES,
    defeated,
    streak,
    multiplier,
    hintedLetters,
    hintCost: HINT_COST,
    hintUsedThisRound,
    puzzleClearEvent,
    status,
    flash,
    pickLetter,
    backspace,
    clearGuess,
    shuffleTiles,
    submitGuess,
    useHint,
    newGame,
  };
}
