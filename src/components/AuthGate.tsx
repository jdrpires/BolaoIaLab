import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { getAccessToken, startGoogleLogin } from "@/lib/api/client";
import { useMe } from "@/lib/api/hooks";
import type { ReactNode } from "react";

export function AuthGate({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const hasToken = Boolean(getAccessToken());
  const { data: me, isLoading } = useMe();

  if (!hasToken) {
    return (
      <GatePanel
        title="Entre para continuar"
        body="Use sua conta Google para acessar esta área do bolão."
        actionLabel="Entrar com Google"
        onAction={() => void startGoogleLogin()}
      />
    );
  }

  if (isLoading) {
    return <GatePanel title="Validando sessão" body="Estamos conferindo suas permissões." />;
  }

  if (requireAdmin && me?.role !== "admin") {
    return (
      <GatePanel
        title="Acesso admin"
        body="Esta área é exclusiva para administradores do bolão."
        actionLabel="Voltar ao dashboard"
        to="/dashboard"
      />
    );
  }

  return <>{children}</>;
}

function GatePanel({
  title,
  body,
  actionLabel,
  onAction,
  to,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  to?: string;
}) {
  return (
    <div className="glass rounded-2xl p-8 max-w-lg">
      <div className="size-11 rounded-xl bg-gradient-brand grid place-items-center mb-4 shadow-glow">
        <Shield className="size-5 text-white" />
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground mt-3">{body}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-glow"
        >
          {actionLabel}
        </button>
      )}
      {actionLabel && to && (
        <Link
          to={to}
          className="mt-6 inline-flex rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-glow"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
