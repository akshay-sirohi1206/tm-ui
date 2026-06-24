// ============================================================
// Backend connection config (Option 1 Dynamic Sync)
// ============================================================

// Kyunki frontend aur backend ek hi Load Balancer par hain,
// window.location.origin se browser ka current URL automatic mil jayega.
const DEFAULT_BASE_URL = typeof window !== "undefined" ? window.location.origin : "http://localhost:8060";

export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL
).replace(/\/+$/, "");

// ------------------------------------------------------------
// WebSocket base URL config
// ------------------------------------------------------------
const DEFAULT_WS_BASE = API_BASE_URL.replace(/^http/i, (m) =>
  m.toLowerCase() === "https" ? "wss" : "ws",
);

export const WS_BASE_URL = (
  (import.meta.env.VITE_WS_BASE_URL as string | undefined) ?? DEFAULT_WS_BASE
).replace(/\/+$/, "");

export const WS_RECONNECT = {
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  maxRetries: 10,
};
