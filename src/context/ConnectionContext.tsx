// ============================================================
// Centralized connection state manager.
// Establishes the WebSocket after login, tears it down on logout
// / page unload, and exposes live status + transport mode.
// ============================================================
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { wsService } from "@/lib/wsService";
import { useAuth } from "@/context/AuthContext";
import type { ConnectionState, ConnectionStatus, TransportMode } from "@/lib/types";

interface ConnectionContextValue extends ConnectionState {
  /** True when WS is live and chat should prefer it. */
  isWebSocketActive: boolean;
  /** True when chat is routing through REST instead of WS. */
  isFallback: boolean;
}

const defaultState: ConnectionContextValue = {
  status: "idle",
  transport: "rest",
  lastConnectedAt: null,
  retryCount: 0,
  isWebSocketActive: false,
  isFallback: false,
};

const ConnectionContext = createContext<ConnectionContextValue>(defaultState);

function transportFor(status: ConnectionStatus): TransportMode {
  return status === "connected" ? "websocket" : "rest";
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [retryCount, setRetryCount] = useState(0);
  const lastConnectedRef = useRef<number | null>(null);

  // Subscribe to the WS service lifecycle.
  useEffect(() => {
    const unsubscribe = wsService.subscribe((nextStatus, nextRetry) => {
      if (nextStatus === "connected") lastConnectedRef.current = Date.now();
      setStatus(nextStatus);
      setRetryCount(nextRetry);
    });
    return unsubscribe;
  }, []);

  // Connect after login, disconnect on logout.
  useEffect(() => {
    if (user) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }
  }, [user]);

  // Clean up on page unload.
  useEffect(() => {
    const onUnload = () => wsService.disconnect();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const value = useMemo<ConnectionContextValue>(() => {
    const transport = transportFor(status);
    return {
      status,
      transport,
      retryCount,
      lastConnectedAt: lastConnectedRef.current,
      isWebSocketActive: status === "connected",
      isFallback:
        status === "fallback" ||
        status === "disconnected" ||
        status === "reconnecting",
    };
  }, [status, retryCount]);

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export const useConnection = () => useContext(ConnectionContext);
