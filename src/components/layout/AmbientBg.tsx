import { useTheme } from "@/context/ThemeContext";

export function AmbientBg() {
  const { isGlass } = useTheme();
  if (!isGlass) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "var(--ambient)",
      }}
    />
  );
}
