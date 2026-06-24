import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSessions } from "@/context/SessionsContext";
import { Navbar } from "@/components/layout/Navbar";
import { FallbackBanner } from "@/components/layout/FallbackBanner";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SessionList } from "@/components/history/SessionList";
import { SettingsView } from "@/components/layout/SettingsView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tata Motors — Multilingual Assistant" },
      { name: "description", content: "Chat by voice or text with the Tata Motors assistant in Hindi, English, Marathi and Hinglish." },
      { property: "og:title", content: "Tata Motors — Multilingual Assistant" },
      { property: "og:description", content: "Apni boli mein baat karo — voice and text assistant by Tata Motors." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const { activeView } = useSessions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <span style={{ color: "var(--text-muted)" }}>Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <Navbar />
      <FallbackBanner />
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <Sidebar />
        {activeView === "chat" && <ChatPanel />}
        {activeView === "history" && <SessionList />}
        {activeView === "settings" && <SettingsView />}
      </div>
    </div>
  );
}
