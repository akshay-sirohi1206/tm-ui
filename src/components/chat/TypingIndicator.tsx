import { useTheme } from "@/context/ThemeContext";

export function TypingIndicator() {
  const { isGlass } = useTheme();
  return (
    <div
      className={isGlass ? "glass-surface" : ""}
      style={{
        alignSelf: "flex-start",
        background: "var(--bg-msg-assistant)",
        border: "1px solid var(--border)",
        borderRadius: isGlass ? "var(--radius-lg)" : "var(--radius-md)",
        padding: "12px 16px",
        display: "flex",
        gap: 5,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--accent-secondary)",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
