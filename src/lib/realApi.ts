// ============================================================
// Real backend API. All endpoints from the provided spec.
// Token storage + auto refresh-on-401 handled in ./http.
// ============================================================
import { del, getJson, patchJson, postForm, postJson, tokenStore } from "./http";
import type { AuthResponse, ChatResponse, Message, Session, User } from "./types";

// Lists may arrive as a bare array or wrapped (e.g. { sessions } / { messages }).
function asArray<T>(data: any, key: string): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

// ---------------- Auth ----------------
export async function login(email: string, password: string): Promise<AuthResponse> {
  const data: AuthResponse = await postJson("/auth/login", { email, password }, { auth: false });
  tokenStore.set(data.access_token, data.refresh_token);
  return data;
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const data: AuthResponse = await postJson(
    "/auth/signup",
    { name, email, password },
    { auth: false },
  );
  tokenStore.set(data.access_token, data.refresh_token);
  return data;
}

export async function getMe(): Promise<User> {
  return getJson("/auth/me");
}

export async function logout(): Promise<void> {
  const refresh = tokenStore.refresh;
  try {
    if (refresh) await postJson("/auth/logout", { refresh_token: refresh });
  } catch {
    // ignore network/logout errors — we clear locally regardless
  }
  tokenStore.clear();
}

export async function changePassword(
  current_password: string,
  new_password: string,
): Promise<unknown> {
  return postJson("/auth/change-password", { current_password, new_password });
}

// ---------------- Sessions ----------------
export async function getSessions(limit = 20, offset = 0): Promise<Session[]> {
  const data = await getJson(`/sessions?limit=${limit}&offset=${offset}`);
  return asArray<Session>(data, "sessions");
}

export async function getSession(sessionId: string): Promise<Session> {
  return getJson(`/sessions/${sessionId}`);
}

export async function createSession(title: string, lang: string): Promise<Session> {
  return postJson("/sessions", { title, lang });
}

export async function updateSession(
  sessionId: string,
  patch: { title?: string; lang?: string },
): Promise<Session> {
  return patchJson(`/sessions/${sessionId}`, patch);
}

export async function deleteSession(sessionId: string): Promise<unknown> {
  return del(`/sessions/${sessionId}`);
}

// ---------------- Messages ----------------
export async function getMessages(sessionId: string, limit = 50, offset = 0): Promise<Message[]> {
  const data = await getJson(`/sessions/${sessionId}/messages?limit=${limit}&offset=${offset}`);
  return asArray<Message>(data, "messages");
}

export async function clearMessages(sessionId: string): Promise<unknown> {
  return del(`/sessions/${sessionId}/messages`);
}

// ---------------- Chat ----------------
export async function sendText(sessionId: string, text: string): Promise<ChatResponse> {
  const fd = new FormData();
  fd.append("text", text);
  return postForm(`/sessions/${sessionId}/chat/text`, fd);
}

export async function sendVoice(sessionId: string, formData: FormData): Promise<ChatResponse> {
  return postForm(`/sessions/${sessionId}/chat/voice`, formData);
}

export async function sendTextStateless(text: string): Promise<ChatResponse> {
  const fd = new FormData();
  fd.append("text", text);
  return postForm(`/chat/text`, fd);
}

export async function sendVoiceStateless(formData: FormData): Promise<ChatResponse> {
  return postForm(`/chat/voice`, formData);
}

export async function tts(text: string, lang: string): Promise<{ audio_base64: string; lang: string }> {
  return postJson("/tts", { text, lang });
}

export async function getAudio(
  sessionId: string,
  messageId: string,
): Promise<{ audio_url?: string; audio_base64?: string }> {
  return getJson(`/sessions/${sessionId}/messages/${messageId}/audio`);
}
