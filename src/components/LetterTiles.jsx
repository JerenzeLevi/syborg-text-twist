export default function LetterTiles({ letters, pickedIndices, onPick, hidden = false, glitching = false }) {
  return (
    <div className={`flex justify-center gap-2 sm:gap-3 flex-wrap ${glitching ? "glitch-shake" : ""}`}>
      {letters.map((letter, i) => {
        const used = pickedIndices.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={used}
            onClick={() => onPick(i)}
            className={`tile w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl flex items-center justify-center ${
              hidden && !used ? "blind-dim" : ""
            }`}
            style={{ opacity: used ? 0.25 : 1, transform: used ? "scale(0.9)" : "scale(1)" }}
          >
            {hidden && !used ? "?" : letter.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
