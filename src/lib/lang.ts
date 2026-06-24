// Lightweight client-side language hint used when creating a new session
// (the backend still performs authoritative detection on each message).
export function detectLang(text: string): { detected_lang: string } {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  return { detected_lang: hasDevanagari ? "hi" : "en" };
}
