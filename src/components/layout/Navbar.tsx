import { useNavigate } from "@tanstack/react-router";
import { Diamond, Layers, Sun, Moon, LogOut } from "lucide-react";
import { useAppConfig } from "@/context/AppConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LogoImg, Avatar } from "@/components/common";
import { ConnectionStatusIndicator } from "@/components/layout/ConnectionStatusIndicator";

function GhostBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
    >
      {children}
    </button>
  );
}

export function Navbar() {
  const { appConfig } = useAppConfig();
  const { user, logout } = useAuth();
  const { isGlass, glassDark, switchToGlass, switchToCreds, toggleGlassMode } = useTheme();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <header
      className={isGlass ? "glass-surface" : ""}
      style={{
        height: 52,
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2">
        {appConfig && <LogoImg url={appConfig.logo_url} name={appConfig.name} height={28} />}
        <span
          className="font-head font-bold"
          style={{ color: "var(--text-primary)", fontSize: 16 }}
        >
          {appConfig?.name ?? ""}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ConnectionStatusIndicator />
        {isGlass && (
          <GhostBtn
            onClick={toggleGlassMode}
            title={glassDark ? "Light glass" : "Dark glass"}
          >
            {glassDark ? <Moon size={18} /> : <Sun size={18} />}
          </GhostBtn>
        )}
        <GhostBtn
          onClick={isGlass ? switchToCreds : switchToGlass}
          title={isGlass ? "Switch to CREDS" : "Switch to Glass"}
        >
          {isGlass ? <Layers size={18} /> : <Diamond size={18} />}
        </GhostBtn>

        {user && (
          <Avatar
            name={user.name}
            size={32}
            radius={isGlass ? "var(--radius-md)" : "var(--radius-sm)"}
          />
        )}
        <span
          className="hidden sm:inline"
          style={{ color: "var(--text-muted)", fontSize: 13 }}
        >
          {user?.name}
        </span>
        <GhostBtn onClick={onLogout} title="Logout">
          <LogOut size={18} />
        </GhostBtn>
      </div>
    </header>
  );
}
