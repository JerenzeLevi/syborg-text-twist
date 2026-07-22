import { useState } from "react";

// Tries public/badges/<id>.png first; falls back to the emoji icon if the
// artwork hasn't been dropped in yet (or fails to load).
export default function BadgeIcon({ badge, size = 40 }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <span style={{ fontSize: size * 0.6 }} className="flex items-center justify-center">
        {badge.icon}
      </span>
    );
  }

  return (
    <img
      src={`/badges/${badge.id}.png`}
      alt={badge.name}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setImgFailed(true)}
    />
  );
}
