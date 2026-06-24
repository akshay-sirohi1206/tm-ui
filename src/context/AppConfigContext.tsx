import { createContext, useContext, type ReactNode } from "react";
import { APP_CONFIG } from "@/lib/appConfig";
import type { AppConfig } from "@/lib/types";

interface AppConfigContextValue {
  appConfig: AppConfig | null;
  loading: boolean;
}

const AppConfigContext = createContext<AppConfigContextValue>({
  appConfig: APP_CONFIG,
  loading: false,
});

export function AppConfigProvider({ children }: { children: ReactNode }) {
  // Branding/config is static frontend config (no backend endpoint in spec).
  return (
    <AppConfigContext.Provider value={{ appConfig: APP_CONFIG, loading: false }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
