import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthCard } from "@/components/auth/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Tata Motors" },
      { name: "description", content: "Sign in to the Tata Motors multilingual voice and text assistant." },
      { property: "og:title", content: "Sign in — Tata Motors" },
      { property: "og:description", content: "Multilingual voice and text assistant by Tata Motors." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: "100vh", background: "var(--bg-base)", padding: 16 }}
    >
      <AuthCard />
    </div>
  );
}
