import { useEffect, useState } from "react";

export default function GlitchOverlay({ active }) {
  const [rift, setRift] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    const interval = setInterval(() => {
      setRift(true);
      setTimeout(() => setRift(false), 260);
    }, 2600);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;
  return (
    <>
      <div className="glitch-scanlines" />
      <div className="glitch-tear-bands" />
      {rift && (
        <div className="glitch-rift">
          <span className="glitch-rift-label">⚠ CORRUPTED ⚠</span>
        </div>
      )}
    </>
  );
}
