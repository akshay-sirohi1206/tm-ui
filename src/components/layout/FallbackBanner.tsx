import { useConnection } from "@/context/ConnectionContext";

export function FallbackBanner() {
  const { isFallback } = useConnection();
  if (!isFallback) return null;

  return (
    <div
      role="alert"
      style={{
        width: "100%",
        textAlign: "center",
        padding: "6px 12px",
        fontSize: 13,
        background: "color-mix(in srgb, #eab308 18%, transparent)",
        color: "var(--text-primary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      Real-time connection unavailable. Using REST API mode.
    </div>
  );
}
