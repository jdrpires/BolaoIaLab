import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { setAccessToken } from "@/lib/api/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Entrando · Copa Tech" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Concluindo login...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("access_token");

    if (!token) {
      setMessage("Não foi possível concluir o login. Tente entrar novamente.");
      return;
    }

    setAccessToken(token);
    void navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Google OAuth</div>
        <h1 className="text-2xl font-bold">Entrando na Copa Tech</h1>
        <p className="text-sm text-muted-foreground mt-3">{message}</p>
      </div>
    </div>
  );
}
