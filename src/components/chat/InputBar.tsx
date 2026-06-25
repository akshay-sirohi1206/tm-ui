import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Mic } from "lucide-react";
import { useSessions } from "@/context/SessionsContext";
import { useTheme } from "@/context/ThemeContext";
import { startPCMRecording, type PCMRecorder } from "@/lib/audioCapture";

export function InputBar() {
  const { sendMessage, sendVoiceMessage } = useSessions();
  const { isGlass } = useTheme();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const onMicDown = async () => {
    try {
      recorderRef.current = await startPCMRecording();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setIsRecording(false);
    }
  };

  const onMicUp = async () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const pcmBlob = await recorderRef.current.stop();
    recorderRef.current = null;
    const formData = new FormData();
    formData.append("audio", pcmBlob, "recording.pcm");
    void sendVoiceMessage(formData);
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
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      <button
        onMouseDown={onMicDown}
        onMouseUp={onMicUp}
        onMouseLeave={isRecording ? onMicUp : undefined}
        onTouchStart={onMicDown}
        onTouchEnd={onMicUp}
        title="Hold to record"
        className={isRecording ? "recording-pulse" : ""}
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          color: "var(--accent-primary)",
          cursor: "pointer",
        }}
      >
        <Mic size={18} />
      </button>

      {isRecording && (
        <span className="font-mono" style={{ color: "var(--accent-primary)", fontSize: 13, alignSelf: "center" }}>
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
  );
}
