export default function XPWindow({ title, children, className = "" }) {
  return (
    <div className={`xp-window w-full ${className}`}>
      <div className="xp-titlebar">
        <span>{title}</span>
        <div className="flex">
          <span className="xp-titlebar-btn">_</span>
          <span className="xp-titlebar-btn">□</span>
          <span className="xp-titlebar-btn" style={{ background: "linear-gradient(180deg,#e88,#c22)" }}>
            ×
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
