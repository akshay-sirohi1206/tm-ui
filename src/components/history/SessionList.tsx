import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSessions } from "@/context/SessionsContext";
import { useTheme } from "@/context/ThemeContext";
import { Skeleton } from "@/components/common";
import type { Session } from "@/lib/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function SessionCard({ session }: { session: Session }) {
  const { activeSessionId, openSession, deleteSession } = useSessions();
  const [hover, setHover] = useState(false);
  const active = activeSessionId === session.session_id;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => void openSession(session.session_id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 12px",
        background: active || hover ? "var(--bg-hover)" : "var(--bg-card)",
        borderLeft: active ? "3px solid var(--accent-primary)" : "3px solid transparent",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
      }}
    >
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div
          style={{
            color: "var(--text-primary)",
            fontSize: 14,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {session.title}
        </div>
        <div className="flex items-center gap-2" style={{ marginTop: 3 }}>
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              background: "var(--bg-card-inner)",
              color: "var(--text-muted)",
              padding: "1px 6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {session.message_count} msg
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {relativeTime(session.updated_at)}
          </span>
        </div>
      </div>
      {hover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void deleteSession(session.session_id);
          }}
          title="Delete"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export function SessionList() {
  const { sessions, loadingSessions, refreshSessions, newSession } = useSessions();

  useEffect(() => {
    void refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto scroll-area" style={{ padding: "20px 18px", background: "var(--bg-panel)" }}>
      <div className="flex items-center justify-between">
        <h2 className="font-head" style={{ color: "var(--text-muted)", fontSize: 11 }}>
          Conversations
        </h2>
        <button
          onClick={newSession}
          className="flex items-center gap-1"
          style={{
            background: "transparent",
            border: "1px solid var(--accent-primary)",
            borderRadius: "var(--radius-md)",
            color: "var(--accent-primary)",
            fontSize: 12,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          <Plus size={14} /> New Chat
        </button>
      </div>

      {loadingSessions ? (
        <>
          <Skeleton height={56} />
          <Skeleton height={56} />
        </>
      ) : sessions.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 20, textAlign: "center" }}>
          No conversations yet. Start a new one!
        </p>
      ) : (
        sessions.map((s) => <SessionCard key={s.session_id} session={s} />)
      )}
    </div>
  );
}
