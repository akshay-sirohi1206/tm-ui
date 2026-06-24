# Tata Motors Chat — Connecting a Real Backend

The entire app currently runs on a fully mocked API layer. No real network
calls are made. When you're ready to attach a real backend (base URL e.g.
`http://localhost:8000`), follow the steps below. The audio capture
(`src/lib/audioCapture.ts`) is already real and needs **zero** changes — it
produces 16kHz mono s16le PCM exactly as the backend expects.

## Where the mock lives

| File | Responsibility |
|---|---|
| `src/lib/mockApi.ts` | All mock functions + in-memory store + canned replies + fake JWT |
| `src/lib/mockAudio.ts` | `SILENT_MP3` base64 constant |
| `src/lib/mockSocket.ts` | Fake WebSocket |
| `src/lib/api.ts` | Thin `sendText` / `sendVoice` wrappers — **swap point** |
| `src/lib/audioCapture.ts` | REAL mic → PCM capture (keep as-is) |
| `src/context/*` | Contexts that call the mock functions |

## Step 1 — Create a real HTTP client

Create `src/lib/http.ts`:

```ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("app_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiPostJson(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiPostForm(path: string, form: FormData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(), // do NOT set Content-Type for FormData
    body: form,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
```

Add `VITE_API_BASE_URL` to your environment.

## Step 2 — Swap `src/lib/api.ts` (chat send)

In `src/lib/api.ts`, comment out the `mock*` returns and uncomment the
`fetch` blocks (text uses `multipart/form-data` field `text`, voice uses field
`audio`):

```ts
export async function sendText(sessionId: string, text: string) {
  const fd = new FormData();
  fd.append("text", text);
  return apiPostForm(`/sessions/${sessionId}/chat/text`, fd);
}

export async function sendVoice(sessionId: string, formData: FormData) {
  return apiPostForm(`/sessions/${sessionId}/chat/voice`, formData);
}
```

## Step 3 — Replace the remaining mock functions

Edit the function bodies in `src/lib/mockApi.ts` (or create `src/lib/realApi.ts`
with the same exported names and update imports in the contexts). Map each mock
to its endpoint:

| Mock function | Real endpoint |
|---|---|
| `mockGetAppConfig()` | `GET /app/config` |
| `mockLogin(email, password)` | `POST /auth/login` |
| `mockRegister(name, email, password)` | `POST /auth/register` |
| `mockGetMe(token)` | `GET /auth/me` |
| `mockGetSessions()` | `GET /sessions?limit=50` → `.sessions` |
| `mockCreateSession(title, lang)` | `POST /sessions` |
| `mockDeleteSession(id)` | `DELETE /sessions/{id}` |
| `mockGetMessages(id)` | `GET /sessions/{id}/messages?limit=100` → `.messages` |
| `mockGetAudio(sid, mid)` | `GET /sessions/{sid}/messages/{mid}/audio` |
| `mockTTS(text, lang)` | `POST /tts` |

Example:

```ts
export async function mockLogin(email: string, password: string) {
  return apiPostJson("/auth/login", { email, password });
}
```

Keep the thrown-error shape consistent: the UI reads `error.detail`. The
`ApiError` class already exposes `.detail`; if you throw the raw JSON from
`http.ts` it also has `.detail`, so `AuthCard` keeps working.

## Step 4 — (Optional) Real WebSocket

Replace `src/lib/mockSocket.ts` usage with a real `WebSocket`:

```ts
const ws = new WebSocket(`${WS_BASE}/ws/chat/${sessionId}`);
ws.onmessage = (e) => handle(JSON.parse(e.data));
ws.send(JSON.stringify({ type: "text", text }));
```

The message payload shapes (`type: "response"`, `response_text`,
`detected_lang`, `transcript`, `audio_base64`) already match the mock.

## Step 5 — Delete the mock once migrated

After confirming everything works against the real backend, you can delete
`mockAudio.ts`-consumers, the in-memory `store`, canned replies, and
`mockSocket.ts`. Keep `audioCapture.ts`.

## Response/field reference

| Field | Meaning |
|---|---|
| `detected_langs` | All detected languages; Hinglish → `["hi","en"]` |
| `dominant_lang` | Primary language |
| `audio_base64` | MP3 base64 — play via `<audio>` / `new Audio("data:audio/mp3;base64,...")` |
| `has_audio_out` | `true` → audio available, fetch the `/audio` endpoint |
| `transcript` | Voice only — speech-to-text result |
