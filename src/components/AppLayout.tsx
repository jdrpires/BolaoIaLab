import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  Sparkles,
  Trophy,
  Building2,
  BarChart3,
  LogOut,
  Shield,
} from "lucide-react";
import type { ReactNode } from "react";
import { clearAccessToken, startGoogleLogin } from "@/lib/api/client";
import { initials } from "@/lib/api/format";
import { useMe } from "@/lib/api/hooks";
import { CompanyOnboarding } from "@/components/CompanyOnboarding";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/palpites", label: "Palpites", icon: Target },
  { to: "/ia", label: "Análise IA", icon: Sparkles },
  { to: "/ranking", label: "Ranking Geral", icon: Trophy },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: me } = useMe();
  const avatar = me ? initials(me.full_name) : "CT";
  const name = me?.full_name ?? "Visitante";
  const company = me?.company?.name ?? me?.email ?? "Modo demonstração";
  const status = me?.role === "admin" ? "admin" : me ? "player" : "visitante";
  const visibleNav =
    me?.role === "admin" ? [...nav, { to: "/admin", label: "Admin", icon: Shield } as const] : nav;
  const logout = () => {
    clearAccessToken();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border p-5 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2.5 mb-10">
          <div className="size-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
            <Trophy className="size-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm leading-tight">Copa Tech</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Onovolab 2026
            </div>
          </div>
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {visibleNav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-gradient-brand text-white shadow-glow font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="glass rounded-xl p-3 mt-4">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-gradient-brand grid place-items-center text-white text-xs font-bold">
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{company}</div>
              <div className="mt-1 text-[9px] uppercase tracking-widest text-primary">{status}</div>
            </div>
            {me ? (
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Sair"
              >
                <LogOut className="size-4" />
              </button>
            ) : (
              <button
                onClick={() => void startGoogleLogin()}
                className="text-[11px] text-primary hover:underline"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-border px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-brand grid place-items-center">
              <Trophy className="size-4 text-white" />
            </div>
            <span className="font-display font-bold text-sm">Copa Tech</span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto">
            {visibleNav.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`p-2 rounded-lg ${active ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                  aria-label={item.label}
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="p-5 lg:p-10 max-w-7xl mx-auto">
          <CompanyOnboarding />
          {children}
        </main>
      </div>
    </div>
  );
}
