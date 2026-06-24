// ============================================================
// WebSocket service layer (singleton).
// - Connects after login, kept alive for the session.
// - Exponential-backoff auto-reconnect on unexpected drops.
// - Exposes connection lifecycle to subscribers.
// - sendChat() resolves with the assistant ChatResponse, or
//   rejects so callers can fall back to REST.
// ============================================================
import { WS_BASE_URL, WS_RECONNECT } from "./config";
import { tokenStore } from "./http";
import type { ChatResponse, ConnectionStatus } from "./types";

type StatusListener = (status: ConnectionStatus, retryCount: number) => void;

interface PendingRequest {
  resolve: (res: ChatResponse) => void;
  reject: (err: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT_MS = 30000;

function genId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "idle";
  private retryCount = 0;
  private manualClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<StatusListener>();
  private pending = new Map<string, PendingRequest>();

  // ---------------- Subscriptions ----------------
  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.retryCount);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) return;
    this.status = status;
    this.listeners.forEach((l) => l(status, this.retryCount));
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.status === "connected";
  }

  // ---------------- Lifecycle ----------------
  connect() {
    if (typeof window === "undefined") return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = tokenStore.access;
    if (!token) {
      console.warn("[WS] No access token; skipping WebSocket connection.");
      return;
    }

    this.manualClose = false;
    this.setStatus(this.retryCount > 0 ? "reconnecting" : "connecting");

    const url = `${WS_BASE_URL}/ws/chat?token=${encodeURIComponent(token)}`;
    console.log(
      `[WS] ${this.retryCount > 0 ? "Reconnecting" : "Connecting"} → ${WS_BASE_URL}/ws/chat (attempt ${this.retryCount + 1})`,
    );

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.error("[WS] Failed to construct WebSocket:", err);
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      console.log("[WS] Connection established.");
      this.retryCount = 0;
      this.setStatus("connected");
    };

    ws.onmessage = (event) => this.handleMessage(event);

    ws.onerror = (event) => {
      console.error("[WS] Socket error:", event);
    };

    ws.onclose = (event) => {
      console.log(`[WS] Connection closed (code ${event.code}).`);
      this.ws = null;
      this.rejectAllPending(new Error("WebSocket closed"));
      if (this.manualClose) {
        this.setStatus("idle");
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.manualClose) return;
    if (this.retryCount >= WS_RECONNECT.maxRetries) {
      console.error("[WS] Max reconnection attempts reached. Falling back to REST.");
      this.setStatus("fallback");
      console.warn("[FALLBACK] Activated — chat will use REST API.");
      return;
    }
    const delay = Math.min(
      WS_RECONNECT.baseDelayMs * 2 ** this.retryCount,
      WS_RECONNECT.maxDelayMs,
    );
    this.retryCount += 1;
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.retryCount}).`);
    // While waiting we are effectively on REST fallback.
    this.setStatus("reconnecting");
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    console.log("[WS] Disconnecting (manual).");
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending(new Error("WebSocket disconnected"));
    this.retryCount = 0;
    if (this.ws) {
      try {
        this.ws.close(1000, "client disconnect");
      } catch {
        /* noop */
      }
      this.ws = null;
    }
    this.setStatus("idle");
  }

  // ---------------- Messaging ----------------
  private handleMessage(event: MessageEvent) {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch {
      console.warn("[WS] Received non-JSON message:", event.data);
      return;
    }

    // Stream chunks (optional, if backend supports them).
    if (data.type === "stream" || data.type === "chunk") {
      // Streaming preview is handled by reload-after-reply; chunks logged only.
      return;
    }

    if (data.type === "pong") return;

    const reqId: string | undefined = data.request_id ?? data.message_id;
    if (reqId && this.pending.has(reqId)) {
      const req = this.pending.get(reqId)!;
      clearTimeout(req.timer);
      this.pending.delete(reqId);
      req.resolve(this.toChatResponse(data));
      return;
    }

    // No matching request id: resolve the oldest pending (single in-flight).
    if (this.pending.size > 0 && (data.type === "response" || data.response_text)) {
      const [id, req] = this.pending.entries().next().value as [string, PendingRequest];
      clearTimeout(req.timer);
      this.pending.delete(id);
      req.resolve(this.toChatResponse(data));
    }
  }

  private toChatResponse(data: any): ChatResponse {
    return {
      response_text: data.response_text ?? "",
      audio_base64: data.audio_base64,
      detected_langs: data.detected_langs,
      dominant_lang: data.dominant_lang,
      english_input: data.english_input,
      transcript: data.transcript ?? null,
    };
  }

  private rejectAllPending(err: unknown) {
    this.pending.forEach((req) => {
      clearTimeout(req.timer);
      req.reject(err);
    });
    this.pending.clear();
  }

  sendChat(sessionId: string, text: string): Promise<ChatResponse> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected() || !this.ws) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      const requestId = genId();
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("WebSocket request timed out"));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(requestId, { resolve, reject, timer });

      try {
        this.ws.send(
          JSON.stringify({ type: "text", request_id: requestId, session_id: sessionId, text }),
        );
        console.log(`[WS] Message sent via WebSocket (session ${sessionId}).`);
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(requestId);
        reject(err);
      }
    });
  }
}

export const wsService = new WebSocketService();
