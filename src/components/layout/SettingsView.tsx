import { useAppConfig } from "@/context/AppConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type Theme } from "@/context/ThemeContext";

const THEMES: { key: Theme; label: string }[] = [
  { key: "creds", label: "CREDS" },
  { key: "glass-light", label: "Glass Light" },
  { key: "glass-dark", label: "Glass Dark" },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{value}</span>
    </div>
  );
}

export function SettingsView() {
  const { appConfig } = useAppConfig();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto scroll-area" style={{ padding: "20px 18px", background: "var(--bg-panel)" }}>
      <h2 className="font-head" style={{ color: "var(--text-muted)", fontSize: 11 }}>
        Settings
      </h2>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
        }}
      >
        <p className="font-head" style={{ color: "var(--text-primary)", fontSize: 13, marginBottom: 8 }}>
          Account
        </p>
        <Row label="Name" value={user?.name ?? "—"} />
        <Row label="Email" value={user?.email ?? "—"} />
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
        }}
      >
        <p className="font-head" style={{ color: "var(--text-primary)", fontSize: 13, marginBottom: 10 }}>
          Theme
        </p>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              style={{
                background: theme === t.key ? "var(--accent-primary)" : "transparent",
                color: theme === t.key ? "var(--text-on-accent)" : "var(--text-muted)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-md)",
                padding: "7px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {appConfig && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
          }}
        >
          <p className="font-head" style={{ color: "var(--text-primary)", fontSize: 13, marginBottom: 8 }}>
            App
          </p>
          <Row label="Name" value={appConfig.name} />
          <Row label="Version" value={appConfig.version} />
          <Row label="Languages" value={appConfig.supported_langs.join(", ")} />
        </div>
      )}
    </div>
  );
}
