// Thin wrappers kept for backward compatibility. These now call the real
// backend (see src/lib/realApi.ts). Change the base URL in src/lib/config.ts.
import { sendText as realSendText, sendVoice as realSendVoice } from "./realApi";
import type { ChatResponse } from "./types";

export async function sendText(sessionId: string, text: string): Promise<ChatResponse> {
  return realSendText(sessionId, text);
}

export async function sendVoice(sessionId: string, formData: FormData): Promise<ChatResponse> {
  return realSendVoice(sessionId, formData);
}
