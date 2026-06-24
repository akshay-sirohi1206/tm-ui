import { useState } from "react";

export function LogoImg({ url, name, height = 28 }: { url: string; name: string; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !url) {
    return (
      <span className="font-head font-bold" style={{ color: "var(--accent-primary)", fontSize: height * 0.7 }}>
        TM
      </span>
    );
  }
  return <img src={url} alt={`${name} logo`} style={{ height }} onError={() => setFailed(true)} />;
}

export function Avatar({ name, size = 32, radius = "var(--radius-sm)" }: { name: string; size?: number; radius?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "var(--accent-primary)",
        color: "var(--text-on-accent)",
        fontSize: size * 0.4,
      }}
    >
      {initials || "U"}
    </div>
  );
}

const LANG_LABELS: Record<string, string> = { hi: "हि", en: "EN", mr: "म", hinglish: "HI+EN" };

export function LanguageBadge({ lang, langs }: { lang: string; langs?: string[] }) {
  let key = lang;
  if (langs && langs.length > 1) key = "hinglish";
  const label = LANG_LABELS[key] ?? lang.toUpperCase();
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 10,
        padding: "1px 5px",
        background: "var(--bg-card-inner)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-muted)",
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}

export function Skeleton({
  width,
  height,
  radius = "var(--radius-md)",
  className = "",
}: {
  width?: number | string;
  height?: number | string;
  radius?: string;
  className?: string;
}) {
  return <div className={`skeleton ${className}`} style={{ width, height, borderRadius: radius }} />;
}
