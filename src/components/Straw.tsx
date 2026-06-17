import React from "react";

const C = {
  straw:          "#C8993A",
  strawLight:     "#E8BF6A",
  strawShort:     "#E05252",
  strawShortLight:"#FF8080",
  card:           "#1E1A2E",
  border:         "#2E2846",
  muted:          "#8C7FA8",
};

// ─── Open straw (result screen) ────────────────────────────────────────────
export function OpenStraw({
  isShort, playerName, delay = 0,
}: {
  isShort: boolean;
  playerName?: string;
  delay?: number;
}) {
  const h     = isShort ? 75 : 135;
  const color = isShort ? C.strawShort : C.straw;
  const light = isShort ? C.strawShortLight : C.strawLight;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        animation: isShort
          ? `revealStraw .6s ease ${delay}s both, shake 0.5s ease ${delay + 0.6}s, shake 1.5s ease ${delay + 0.7}s infinite`
          : `revealStraw .6s ease ${delay}s both`,
      }}>
        <svg width="28" height={h + 14} viewBox={`0 0 28 ${h + 14}`}>
          <ellipse cx="14" cy="8"  rx="11" ry="6" fill={light} />
          <ellipse cx="14" cy="6"  rx="11" ry="4" fill={light} opacity=".9" />
          <rect x="8"  y="10" width="12" height={h} rx="3" fill={color} />
          <rect x="11" y="10" width="3"  height={h} rx="1.5" fill={light} opacity=".35" />
          <ellipse cx="14" cy={10 + h} rx="6" ry="3" fill={color} />
        </svg>
      </div>
      {playerName && (
        <div style={{
          marginTop: 6, fontSize: 11, textAlign: "center", width: 60,
          color: isShort ? C.strawShortLight : C.muted,
          fontWeight: isShort ? 700 : 400,
          wordBreak: "break-word",
          animation: `revealStraw .4s ease ${delay + .2}s both`,
        }}>
          {playerName}
        </div>
      )}
    </div>
  );
}

// ─── Closed straw (draw screen) ────────────────────────────────────────────
export function ClosedStraw({
  index, onPick, picked, isMyPick, myName, disabled,
}: {
  index: number;
  onPick: () => void;
  picked: boolean;
  isMyPick: boolean;
  myName: string;
  disabled: boolean;
}) {
  const canPick = !disabled && !picked;
  return (
    <div
      onClick={canPick ? onPick : undefined}
      title={canPick ? `Choisir la paille ${index + 1}` : undefined}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        cursor: canPick ? "pointer" : "default",
        opacity: picked && !isMyPick ? 0.3 : 1,
        transition: "opacity .25s, transform .12s",
        transform: canPick ? undefined : "none",
        userSelect: "none",
      }}
      onMouseEnter={e => { if (canPick) (e.currentTarget as HTMLElement).style.transform = "scale(1.08) translateY(-4px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      <svg width="28" height="64" viewBox="0 0 28 64">
        <rect x="8"  y="0" width="12" height="58" rx="3"   fill={C.straw} />
        <rect x="11" y="0" width="3"  height="58" rx="1.5" fill={C.strawLight} opacity=".35" />
        <ellipse cx="14" cy="58" rx="6" ry="3" fill={C.straw} />
        {/* Hand covering top */}
        <rect x="2" y="0" width="24" height="26" rx="5" fill={C.card} />
        <rect x="2" y="0" width="24" height="26" rx="5" fill={C.border} opacity=".9" />
      </svg>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
        {isMyPick ? myName : picked ? "✓" : String(index + 1)}
      </div>
    </div>
  );
}

// ─── Hero straws (home screen) ─────────────────────────────────────────────
export function HeroStraws() {
  const heights = [130, 95, 140, 105, 120, 90, 135];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 28 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 14, height: h, borderRadius: 7,
          background: `linear-gradient(to bottom, var(--straw-light), var(--straw))`,
          boxShadow: "0 4px 16px #D4A84333",
          animation: `floatUp ${1.1 + i * .15}s ease-in-out ${i * .13}s infinite alternate`,
          "--r": `${(i - 3) * 2}deg`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
