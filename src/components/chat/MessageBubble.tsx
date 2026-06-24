import { useState } from "react";
import { Volume2, AudioWaveform } from "lucide-react";
import type { Message } from "@/lib/types";
import { useTheme } from "@/context/ThemeContext";
import { useSessions } from "@/context/SessionsContext";
import { LanguageBadge } from "@/components/common";
import { getAudio } from "@/lib/realApi";

function playBase64(b64: string) {
  const audio = new Audio(`data:audio/mp3;base64,${b64}`);
  audio.play().catch(() => {});
}

function playUrl(url: string) {
  const audio = new Audio(url);
  audio.play().catch(() => {});
}

export function MessageBubble({ message }: { message: Message }) {
  const { isGlass } = useTheme();
  const isUser = message.role === "user";
  const text = isUser ? message.original_text : message.response_text;

  const corner = isGlass ? "var(--radius-lg)" : "var(--radius-md)";
  const sharp = "var(--radius-sm)";

  const radius = isUser
    ? `${corner} ${isGlass ? corner : sharp} ${corner} ${corner}`
    : `${isGlass ? corner : sharp} ${corner} ${corner} ${corner}`;

  return (
    <div
      className="flex flex-col"
      style={{ alignItems: isUser ? "flex-end" : "flex-start", maxWidth: "100%" }}
    >
      {message.content_type === "voice" && message.transcript && (
        <div
          className="flex items-center gap-1"
          style={{ color: "var(--text-muted)", fontSize: 11, fontStyle: "italic", marginBottom: 3 }}
        >
          <AudioWaveform size={13} />
          <span>{message.transcript}</span>
        </div>
      )}
      <div
        className={isGlass ? "glass-surface" : ""}
        style={{
          maxWidth: "78%",
          background: isUser ? "var(--bg-msg-user)" : "var(--bg-msg-assistant)",
          color: isUser ? "var(--text-on-accent)" : "var(--text-primary)",
          border: isUser ? "none" : "1px solid var(--border)",
          borderRadius: radius,
          padding: "9px 12px",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <div className="flex items-start gap-2" style={{ justifyContent: "space-between" }}>
          <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{text}</span>
          <LanguageBadge lang={message.detected_lang} langs={message.detected_langs} />
        </div>
        {!isUser && message.has_audio_out && (
          <div className="flex justify-end" style={{ marginTop: 4 }}>
            <PlayButton message={message} onPlay={playBase64} />
          </div>
        )}
      </div>
    </div>
  );
}

function PlayButton({
  message,
  onPlay,
}: {
  message: Message;
  onPlay: (b64: string) => void;
}) {
  const { activeSessionId } = useSessions();
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (message.audio_base64) {
      onPlay(message.audio_base64);
      return;
    }
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const res = await getAudio(activeSessionId, message.message_id);
      if (res.audio_base64) onPlay(res.audio_base64);
      else if (res.audio_url) playUrl(res.audio_url);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handle}
      title="Play audio"
      disabled={loading}
      style={{
        background: "none",
        border: "none",
        color: "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Volume2 size={15} />
    </button>
  );
}
