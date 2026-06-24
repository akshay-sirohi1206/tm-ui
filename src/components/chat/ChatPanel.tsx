import { useEffect, useRef } from "react";
import { useSessions } from "@/context/SessionsContext";
import { useAuth } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useTheme } from "@/context/ThemeContext";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { InputBar } from "./InputBar";
import { Skeleton } from "@/components/common";

function SuggestionChips() {
  const { appConfig } = useAppConfig();
  const { sendMessage } = useSessions();
  const { isGlass } = useTheme();
  if (!appConfig) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 520 }}>
      {appConfig.suggestion_chips.map((chip) => (
        <button
          key={chip}
          onClick={() => void sendMessage(chip)}
          className={`chip ${isGlass ? "glass-surface" : ""}`}
          style={{
            background: "var(--bg-card-inner)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: 13,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function WelcomeState() {
  const { user } = useAuth();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-head font-bold" style={{ color: "var(--text-primary)", fontSize: 32 }}>
        नमस्ते 🙏
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
        Welcome, {user?.name ?? "there"}!
      </p>
      <SuggestionChips />
    </div>
  );
}

export function ChatPanel() {
  const { activeSessionId, messages, typing, loadingMessages } = useSessions();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const showWelcome = !activeSessionId && messages.length === 0;

  return (
    <div className="flex flex-1 flex-col" style={{ minWidth: 0, background: "var(--bg-panel)" }}>
      <div
        ref={scrollRef}
        className="scroll-area flex flex-1 flex-col gap-3 overflow-y-auto"
        style={{ padding: showWelcome ? 0 : "20px 18px" }}
      >
        {showWelcome ? (
          <WelcomeState />
        ) : loadingMessages ? (
          <div className="flex flex-col gap-3">
            <Skeleton width="60%" height={44} />
            <Skeleton width="70%" height={56} />
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble key={m.message_id} message={m} />
            ))}
            {typing && <TypingIndicator />}
          </>
        )}
      </div>
      <InputBar />
    </div>
  );
}
