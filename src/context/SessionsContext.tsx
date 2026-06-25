import { createContext, useContext, useState, type ReactNode } from "react";
import {
  createSession as apiCreateSession,
  deleteSession as apiDeleteSession,
  getMessages,
  getSessions,
} from "@/lib/realApi";
import { detectLang } from "@/lib/lang";
import { sendText as apiSendText, sendVoice as apiSendVoice } from "@/lib/api";
import { wsService } from "@/lib/wsService";
import type { Message, Session } from "@/lib/types";

export type ActiveView = "chat" | "history" | "settings";

interface SessionsContextValue {
  sessions: Session[];
  activeSessionId: string | null;
  messages: Message[];
  activeView: ActiveView;
  loadingSessions: boolean;
  loadingMessages: boolean;
  typing: boolean;
  setActiveView: (v: ActiveView) => void;
  refreshSessions: () => Promise<void>;
  newSession: () => void;
  openSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (formData: FormData) => Promise<void>;
}

const SessionsContext = createContext<SessionsContextValue>({} as SessionsContextValue);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typing, setTyping] = useState(false);

  const refreshSessions = async () => {
    setLoadingSessions(true);
    try {
      const list = await getSessions();
      setSessions(list);
    } finally {
      setLoadingSessions(false);
    }
  };

  const newSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setActiveView("chat");
  };

  const openSession = async (id: string) => {
    setActiveSessionId(id);
    setActiveView("chat");
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(id);
      setMessages(msgs);
    } finally {
      setLoadingMessages(false);
    }
  };

  const deleteSession = async (id: string) => {
    await apiDeleteSession(id);
    setSessions((prev) => prev.filter((s) => s.session_id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const ensureSession = async (firstText: string): Promise<string> => {
    if (activeSessionId) return activeSessionId;
    const lang = detectLang(firstText).detected_lang;
    const session = await apiCreateSession(firstText.slice(0, 40), lang);
    setActiveSessionId(session.session_id);
    return session.session_id;
  };

  const reloadAfterReply = async (sessionId: string) => {
    const msgs = await getMessages(sessionId);
    setMessages(msgs);
    await refreshSessions();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setActiveView("chat");
    const sessionId = await ensureSession(text);
    setTyping(true);
    try {
      // WebSocket-first routing:
      // - If the socket is open, ALWAYS send via WebSocket (never REST).
      // - If it is not open, retry the connection up to 3 times.
      // - Only after all retries fail do we fall back to REST.
      let useWebSocket = wsService.isConnected();
      if (!useWebSocket) {
        useWebSocket = await wsService.ensureConnected(3);
      }

      if (useWebSocket) {
        await wsService.sendChat(sessionId, text);
        console.log("[WS] Message sent via WebSocket.");
      } else {
        console.warn("[FALLBACK] WebSocket unavailable after retries — using REST API.");
        await apiSendText(sessionId, text);
        console.log("[REST] Message sent via REST API (fallback).");
      }
      await reloadAfterReply(sessionId);
    } finally {
      setTyping(false);
    }
  };

  const sendVoiceMessage = async (formData: FormData) => {
    setActiveView("chat");
    const sessionId = await ensureSession("Voice message");
    setTyping(true);
    try {
      await apiSendVoice(sessionId, formData);
      await reloadAfterReply(sessionId);
    } finally {
      setTyping(false);
    }
  };

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        activeSessionId,
        messages,
        activeView,
        loadingSessions,
        loadingMessages,
        typing,
        setActiveView,
        refreshSessions,
        newSession,
        openSession,
        deleteSession,
        sendMessage,
        sendVoiceMessage,
      }}
    >
      {children}
    </SessionsContext.Provider>
  );
}

export const useSessions = () => useContext(SessionsContext);
