import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Mic, Square } from "lucide-react";
import { useSessions } from "@/context/SessionsContext";
import { useTheme } from "@/context/ThemeContext";
import { startPCMRecording, type PCMRecorder } from "@/lib/audioCapture";

const CLICK_DEBOUNCE_MS = 300;

export function InputBar() {
  const { sendMessage, sendVoiceMessage } = useSessions();
  const { isGlass } = useTheme();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastClickRef = useRef(0);
  const busyRef = useRef(false);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    void sendMessage(value);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
    }
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      recorderRef.current = await startPCMRecording();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      // Permission denied or no device — surface a clear error instead of failing silently.
      recorderRef.current = null;
      setIsRecording(false);
      const name = (err as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setMicError("Microphone access was denied. Please allow mic permission and try again.");
      } else if (name === "NotFoundError") {
        setMicError("No microphone was found on this device.");
      } else {
        setMicError("Could not start recording. Please try again.");
      }
    }
  };

  const stopRecording = async () => {
    clearTimer();
    setIsRecording(false);
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;
    // Fully stop and clean up the recorder before allowing a new recording.
    const pcmBlob = await recorder.stop();
    const formData = new FormData();
    formData.append("audio", pcmBlob, "recording.pcm");
    void sendVoiceMessage(formData);
  };

  // Single click toggles recording. Debounced to prevent double-firing,
  // and guarded so a new recording can't start until the previous one is
  // fully stopped and cleaned up.
  const onMicClick = async () => {
    const now = Date.now();
    if (now - lastClickRef.current < CLICK_DEBOUNCE_MS) return;
    lastClickRef.current = now;
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      if (isRecording || recorderRef.current) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } finally {
      busyRef.current = false;
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      className={isGlass ? "glass-surface" : ""}
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {micError && (
        <span style={{ color: "var(--danger, #e5484d)", fontSize: 12 }}>{micError}</span>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <button
          onClick={onMicClick}
          title={isRecording ? "Click to stop & send" : "Click to record"}
          className={isRecording ? "recording-pulse" : ""}
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isRecording ? "var(--accent-primary)" : "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: isRecording ? "var(--text-on-accent)" : "var(--accent-primary)",
            cursor: "pointer",
          }}
        >
          {isRecording ? <Square size={16} /> : <Mic size={18} />}
        </button>

        {isRecording && (
          <span
            className="font-mono"
            style={{ color: "var(--accent-primary)", fontSize: 13, alignSelf: "center" }}
          >
            {fmt(elapsed)}
          </span>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
          placeholder="Type anything…  (Ctrl+Enter to send)"
          style={{
            flexGrow: 1,
            resize: "none",
            maxHeight: 120,
            background: "var(--bg-input)",
            border: `1px solid ${focused ? "var(--border-accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            padding: "9px 12px",
            fontSize: 14,
            outline: "none",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.4,
          }}
        />

        <button
          onClick={submit}
          title="Send"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--accent-primary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: "var(--text-on-accent)",
            cursor: "pointer",
          }}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
