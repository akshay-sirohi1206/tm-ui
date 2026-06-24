import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, login as apiLogin, logout as apiLogout, signup } from "@/lib/realApi";
import { tokenStore } from "@/lib/http";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // React to forced logout triggered by failed token refresh.
  useEffect(() => {
    const onForceLogout = () => {
      localStorage.removeItem("app_theme");
      setUser(null);
    };
    window.addEventListener("app:force-logout", onForceLogout);
    return () => window.removeEventListener("app:force-logout", onForceLogout);
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    setUser(await getMe());
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await signup(name, email, password);
    setUser(res.user ?? (await getMe()));
  };

  const logout = () => {
    void apiLogout();
    localStorage.removeItem("app_theme");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
