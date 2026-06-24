// Shared domain types used across the app (data layer + UI).

export interface User {
  user_id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface AppConfig {
  name: string;
  logo_url: string;
  tagline: string;
  suggestion_chips: string[];
  supported_langs: string[];
  version: string;
}

export interface Session {
  session_id: string;
  title: string;
  lang: string;
  message_count: number;
  updated_at: string;
  created_at?: string;
}

export interface Message {
  message_id: string;
  role: "user" | "assistant";
  original_text?: string;
  response_text?: string;
  detected_lang: string;
  detected_langs?: string[];
  content_type: "text" | "voice";
  transcript?: string | null;
  created_at: string;
  has_audio_out: boolean;
  audio_base64?: string;
}

export interface ChatResponse {
  response_text: string;
  audio_base64?: string;
  detected_langs?: string[];
  dominant_lang?: string;
  english_input?: string;
  transcript?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user?: User;
}

// ---------------- Realtime / transport ----------------
export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "fallback";

export type TransportMode = "websocket" | "rest";

export interface ConnectionState {
  status: ConnectionStatus;
  transport: TransportMode;
  lastConnectedAt: number | null;
  retryCount: number;
}
