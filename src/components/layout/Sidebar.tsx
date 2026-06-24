import { MessageCircle, History, Settings, Plus } from "lucide-react";
import { useSessions, type ActiveView } from "@/context/SessionsContext";
import { useTheme } from "@/context/ThemeContext";

const NAV: { icon: typeof MessageCircle; label: string; view: ActiveView }[] = [
  { icon: MessageCircle, label: "Chat", view: "chat" },
  { icon: History, label: "History", view: "history" },
  { icon: Settings, label: "Settings", view: "settings" },
];

export function Sidebar() {
  const { activeView, setActiveView, newSession } = useSessions();
  const { isGlass } = useTheme();

  return (
    <nav
      className={isGlass ? "glass-surface" : ""}
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "10px 0",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <button
        onClick={newSession}
        title="New Chat"
        style={{
          width: 48,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "1px solid var(--accent-primary)",
          borderRadius: "var(--radius-md)",
          color: "var(--accent-primary)",
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        <Plus size={20} />
      </button>

      {NAV.map((item) => {
        const active = activeView === item.view;
        const Icon = item.icon;
        return (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            style={{
              width: 48,
              height: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: active ? "var(--bg-hover)" : "transparent",
              border: "none",
              borderLeft: active ? "3px solid var(--accent-primary)" : "3px solid transparent",
              borderRadius: "var(--radius-sm)",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            <Icon size={20} />
            <span
              className="font-head"
              style={{
                fontSize: 9,
                color: active ? "var(--accent-secondary)" : "var(--text-muted)",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
