import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useAppConfig } from "@/context/AppConfigContext";
import { useTheme } from "@/context/ThemeContext";
import { LogoImg, Skeleton } from "@/components/common";
import { ApiError } from "@/lib/http";

const inputStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  padding: "10px 12px",
  fontSize: 14,
  width: "100%",
  outline: "none",
};

export function AuthCard() {
  const { appConfig, loading: configLoading } = useAppConfig();
  const { login, register } = useAuth();
  const { isGlass } = useTheme();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldStyle = (key: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === key ? "var(--border-accent)" : "var(--border)",
    boxShadow: focused === key ? "0 0 0 2px var(--border-accent)" : "none",
  });

  return (
    <div
      className={isGlass ? "glass-surface" : ""}
      style={{
        width: 420,
        maxWidth: "92vw",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-strong)",
        borderTop: isGlass ? "1px solid var(--border-strong)" : "2px solid var(--accent-tata)",
        boxShadow: "var(--shadow)",
        padding: "32px 28px",
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {configLoading ? (
          <>
            <Skeleton width={120} height={44} />
            <Skeleton width={160} height={22} />
          </>
        ) : (
          <>
            <LogoImg url={appConfig!.logo_url} name={appConfig!.name} height={44} />
            <h1
              className="font-head font-bold"
              style={{ color: "var(--text-primary)", fontSize: 22, margin: 0 }}
            >
              {appConfig!.name}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, textAlign: "center" }}>
              {appConfig!.tagline}
            </p>
          </>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />

      <p
        className="font-head"
        style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 14 }}
      >
        {mode === "login" ? "Sign in to continue" : "Create your account"}
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === "register" && (
          <input
            style={fieldStyle("name")}
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            required
          />
        )}
        <input
          style={fieldStyle("email")}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
          required
        />
        <input
          style={fieldStyle("password")}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setFocused("password")}
          onBlur={() => setFocused(null)}
          required
        />

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="font-head font-bold"
          style={{
            background: "var(--accent-primary)",
            color: "var(--text-on-accent)",
            borderRadius: "var(--radius-md)",
            padding: "11px",
            fontSize: 14,
            border: "none",
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-secondary)",
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
          }}
        >
          {mode === "login" ? "Register" : "Sign In"}
        </button>
      </p>

    </div>
  );
}
