import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "creds" | "glass-light" | "glass-dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  isGlass: boolean;
  glassDark: boolean;
  switchToGlass: () => void;
  switchToCreds: () => void;
  toggleGlassMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("creds");

  useEffect(() => {
    const stored = localStorage.getItem("app_theme") as Theme | null;
    if (stored === "creds" || stored === "glass-light" || stored === "glass-dark") {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const isGlass = theme === "glass-light" || theme === "glass-dark";
  const glassDark = theme === "glass-dark";

  const switchToGlass = () => setThemeState("glass-light");
  const switchToCreds = () => setThemeState("creds");
  const toggleGlassMode = () =>
    setThemeState((prev) => (prev === "glass-dark" ? "glass-light" : "glass-dark"));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isGlass,
        glassDark,
        switchToGlass,
        switchToCreds,
        toggleGlassMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
