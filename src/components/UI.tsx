import React, { useState } from "react";

// ─── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #201C30 0%, #1A1628 100%)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: "28px 24px",
      width: "100%",
      maxWidth: 440,
      boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.45)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, React.CSSProperties> = {
  primary:   { background: "linear-gradient(135deg, var(--gold-light), var(--gold-dark))", color: "#140E00", border: "none" },
  secondary: { background: "linear-gradient(145deg, #201C30, #1A1628)", color: "var(--text)", border: "1px solid var(--border)" },
  ghost:     { background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" },
  danger:    { background: "var(--danger)", color: "#fff", border: "none" },
};

export function Btn({
  children, onClick, variant = "primary", disabled, loading, fullWidth = true,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        // variant styles first (background, color, border)
        ...variants[variant],
        // layout & typography (override variant if needed)
        borderRadius: 12,
        padding: "14px 24px",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: ".02em",
        width: fullWidth ? "100%" : "auto",
        marginBottom: 10,
        fontFamily: "inherit",
        // runtime states (always last)
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "opacity .18s, transform .15s, box-shadow .18s",
        transform: hover && !disabled && !loading ? "translateY(-2px)" : "none",
        boxShadow: variant === "primary" && !disabled
          ? hover ? "0 6px 28px rgba(212, 168, 67, 0.45)" : "0 2px 14px rgba(212, 168, 67, 0.22)"
          : "none",
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────
export function Input({
  value, onChange, placeholder, maxLength, large, centered, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  large?: boolean;
  centered?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: "100%",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "13px 16px",
        color: "var(--text)",
        fontSize: large ? 28 : 16,
        fontWeight: large ? 700 : 400,
        letterSpacing: large ? "0.2em" : "normal",
        textAlign: centered ? "center" : "left",
        outline: "none",
        marginBottom: 12,
        fontFamily: "inherit",
        transition: "border-color .2s",
      }}
      onFocus={e => e.target.style.borderColor = "var(--gold)"}
      onBlur={e  => e.target.style.borderColor = "var(--border)"}
    />
  );
}

// ─── Label ─────────────────────────────────────────────────────────────────
export function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>{children}</div>;
}

// ─── Error ─────────────────────────────────────────────────────────────────
export function ErrorMsg({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div role="alert" style={{
      color: "var(--danger)", fontSize: 13,
      marginBottom: 10, textAlign: "center",
    }}>
      {msg}
    </div>
  );
}

// ─── Offline banner ────────────────────────────────────────────────────────
export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      background: "#B45309", color: "#fff",
      padding: "10px 16px", textAlign: "center",
      fontSize: 13, fontWeight: 600,
      animation: "slideDown .3s ease",
    }}>
      ⚡ Connexion perdue — tes actions sont en attente
    </div>
  );
}

// ─── Session code display ──────────────────────────────────────────────────
export function SessionCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Code de session
      </div>
      <div
        onClick={copy}
        title="Cliquer pour copier"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "inline-block",
          fontSize: 52, fontWeight: 900, letterSpacing: "0.3em",
          background: "linear-gradient(135deg, var(--gold-light), var(--gold))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          cursor: "pointer",
          userSelect: "none",
          transition: "opacity .15s, transform .15s",
          opacity: hover ? 0.8 : 1,
          transform: hover ? "scale(1.03)" : "none",
        }}
      >
        {code}
      </div>
      <div style={{ fontSize: 12, color: copied ? "var(--success)" : "var(--muted)", marginTop: 6, transition: "color .2s" }}>
        {copied ? "✓ Copié !" : "Clique pour copier · Partage ce code avec tes amis"}
      </div>
    </div>
  );
}

// ─── Shell layout ──────────────────────────────────────────────────────────
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
    }}>
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontSize: 28, fontWeight: 900, textAlign: "center", marginBottom: 8,
      background: "linear-gradient(135deg, var(--gold-light), var(--gold))",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}>
      {children}
    </h1>
  );
}

export function PageSub({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>{children}</p>;
}
