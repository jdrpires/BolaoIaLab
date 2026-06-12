import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";
import { TeamLogo } from "@/components/TeamLogo";
import { lastResults, stats } from "@/lib/mock-data";
import { formatMatchDate, formatMatchTime, toRankingPlayer } from "@/lib/api/format";
import { useIndividualRanking, useMatches, useMe } from "@/lib/api/hooks";
import type { ApiTeam } from "@/lib/api/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Trophy,
  Brain,
  Zap,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Copa Tech Onovolab 2026" }] }),
  component: Dashboard,
});

const statCards = [
  {
    label: "Seus pontos",
    value: "224",
    trend: "+12",
    icon: Trophy,
    accent: "from-fuchsia-500 to-purple-600",
  },
  {
    label: "Posição",
    value: "#3",
    trend: "↑ 4",
    icon: TrendingUp,
    accent: "from-emerald-400 to-teal-500",
  },
  {
    label: "Palpites feitos",
    value: "32",
    trend: "12 acertos",
    icon: Target,
    accent: "from-blue-500 to-indigo-600",
  },
  {
    label: "Análises IA",
    value: "18",
    trend: "+3 hoje",
    icon: Brain,
    accent: "from-violet-500 to-fuchsia-500",
  },
];

function Dashboard() {
  const { data: me } = useMe();
  const { data: apiMatches = [], isLoading: matchesLoading } = useMatches();
  const { data: apiRanking = [], isLoading: rankingLoading } = useIndividualRanking(5);
  const ranking = apiRanking.map(toRankingPlayer);
  const firstName = me?.full_name?.split(" ")[0] || "participante";

  return (
    <AppLayout>
      <AuthGate>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
              Bem-vindo(a), {firstName}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Sua Copa Tech começou 🏆</h1>
            <p className="text-muted-foreground mt-1">
              Você está em <span className="text-foreground font-medium">3º lugar</span> ·{" "}
              {stats.participants} participantes na disputa
            </p>
          </div>
          <Link
            to="/palpites"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 font-medium text-white shadow-glow self-start"
          >
            Fazer palpites <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, trend, icon: Icon, accent }) => (
            <div key={label} className="glass rounded-2xl p-5 relative overflow-hidden">
              <div
                className={`absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br ${accent} opacity-30 blur-2xl`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`size-10 rounded-xl bg-gradient-to-br ${accent} grid place-items-center`}
                  >
                    <Icon className="size-5 text-white" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-success">{trend}</span>
                </div>
                <div className="text-3xl font-display font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Próximos jogos */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Zap className="size-5 text-primary" /> Próximos jogos
              </h2>
              <Link to="/palpites" className="text-xs text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {matchesLoading && <EmptyLine label="Carregando jogos..." />}
              {!matchesLoading &&
                apiMatches.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-background/40 hover:bg-background/60 transition"
                  >
                    <div className="text-center w-14 shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatMatchDate(m.starts_at)}
                      </div>
                      <div className="text-sm font-semibold">{formatMatchTime(m.starts_at)}</div>
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-3">
                      <TeamSide team={m.home_team} align="right" />
                      <span className="text-xs text-muted-foreground font-medium">VS</span>
                      <TeamSide team={m.away_team} align="left" />
                    </div>
                    <span className="hidden md:inline text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.stage}
                    </span>
                  </div>
                ))}
              {!matchesLoading && apiMatches.length === 0 && (
                <EmptyLine label="Nenhum jogo cadastrado ainda." />
              )}
            </div>
          </div>

          {/* Ranking resumido */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Trophy className="size-5 text-primary" /> Top 5
              </h2>
              <Link to="/ranking" className="text-xs text-primary hover:underline">
                Geral
              </Link>
            </div>
            <div className="space-y-2.5">
              {rankingLoading && <EmptyLine label="Carregando ranking..." />}
              {ranking.slice(0, 5).map((p) => (
                <div key={p.rank} className="flex items-center gap-3">
                  <div
                    className={`size-7 rounded-lg grid place-items-center text-xs font-bold ${p.rank <= 3 ? "bg-gradient-brand text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {p.rank}
                  </div>
                  <div className="size-9 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold text-white">
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.company}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{p.points}</div>
                    <TrendBadge t={p.trend} />
                  </div>
                </div>
              ))}
              {!rankingLoading && ranking.length === 0 && (
                <EmptyLine label="Ranking ainda sem participantes." />
              )}
            </div>
          </div>

          {/* Últimos resultados */}
          <div className="lg:col-span-3 glass rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-5">Últimos resultados</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {lastResults.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-background/40">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    {r.date} · {r.stage}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{r.home.logo}</span>
                      <span className="text-sm font-medium truncate">{r.home.short}</span>
                    </div>
                    <div className="text-lg font-display font-bold">
                      {r.result!.home} <span className="text-muted-foreground mx-1">·</span>{" "}
                      {r.result!.away}
                    </div>
                    <div className="flex items-center gap-2 min-w-0 justify-end">
                      <span className="text-sm font-medium truncate">{r.away.short}</span>
                      <span className="text-lg">{r.away.logo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AuthGate>
    </AppLayout>
  );
}

function TeamSide({ team, align }: { team: ApiTeam; align: "left" | "right" }) {
  return (
    <div
      className={`flex items-center gap-2 flex-1 ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      {align === "left" && <TeamLogo team={team} size="sm" />}
      <span className="text-sm font-medium truncate">{team.name}</span>
      {align === "right" && <TeamLogo team={team} size="sm" />}
    </div>
  );
}

function EmptyLine({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-background/40 p-4 text-sm text-muted-foreground">{label}</div>
  );
}

export function TrendBadge({ t }: { t: number }) {
  if (t > 0)
    return (
      <span className="inline-flex items-center text-[10px] text-success">
        <TrendingUp className="size-3" />
        {t}
      </span>
    );
  if (t < 0)
    return (
      <span className="inline-flex items-center text-[10px] text-destructive">
        <TrendingDown className="size-3" />
        {Math.abs(t)}
      </span>
    );
  return (
    <span className="inline-flex items-center text-[10px] text-muted-foreground">
      <Minus className="size-3" />
    </span>
  );
}
