import { useConnection } from "@/context/ConnectionContext";
import type { ConnectionStatus } from "@/lib/types";

const COLORS: Record<ConnectionStatus, string> = {
  idle: "#9ca3af", // grey
  connecting: "#eab308", // yellow
  reconnecting: "#eab308", // yellow
  connected: "#22c55e", // green
  disconnected: "#ef4444", // red
  fallback: "#ef4444", // red (REST fallback)
};

const LABELS: Record<ConnectionStatus, string> = {
  idle: "Not initialized",
  connecting: "Connecting...",
  reconnecting: "Reconnecting...",
  connected: "WebSocket Connected",
  disconnected: "Connection Lost",
  fallback: "Using REST API Fallback",
};

export function ConnectionStatusIndicator() {
  const { status } = useConnection();
  const color = COLORS[status];
  const label = LABELS[status];
  const pulsing = status === "connecting" || status === "reconnecting";

  return (
    <div
      title={label}
      aria-label={label}
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        height: 34,
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-md)",
        cursor: "default",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: pulsing ? "tm-pulse 1s ease-in-out infinite" : undefined,
        }}
      />
      <span
        className="hidden md:inline"
        style={{ color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}
      >
        {label}
      </span>
      <style>{`@keyframes tm-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
