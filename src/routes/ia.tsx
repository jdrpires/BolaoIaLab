import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";
import { TeamLogo } from "@/components/TeamLogo";
import { getAccessToken, startGoogleLogin } from "@/lib/api/client";
import { formatMatchDate, formatMatchTime } from "@/lib/api/format";
import { useGenerateMatchAnalysis, useMatchAnalysis, useMatches } from "@/lib/api/hooks";
import type { ApiGameAnalysis, ApiMatch, ApiTeam } from "@/lib/api/types";
import { Activity, Brain, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/ia")({
  validateSearch: (s: Record<string, unknown>) => ({ match: (s.match as string) || "" }),
  head: () => ({ meta: [{ title: "Análise IA · Copa Tech" }] }),
  component: IAPage,
});

function IAPage() {
  const { match: selectedMatchId } = Route.useSearch();
  const { data: matches = [], isLoading: matchesLoading } = useMatches();
  const match = matches.find((item) => item.id === selectedMatchId) ?? matches[0] ?? null;
  const { data: analysis, isLoading: analysisLoading } = useMatchAnalysis(match?.id ?? null);
  const generateAnalysis = useGenerateMatchAnalysis();

  const requestAnalysis = async (force = false) => {
    if (!match) return;
    if (!getAccessToken()) {
      await startGoogleLogin();
      return;
    }
    await generateAnalysis.mutateAsync({ matchId: match.id, force });
  };

  return (
    <AppLayout>
      <AuthGate>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <Brain className="size-5 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-primary">Análise IA</div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {match ? <MatchTitle match={match} /> : "Escolha um jogo"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {match
                  ? `${formatMatchDate(match.starts_at)} · ${formatMatchTime(match.starts_at)} · ${match.stage}`
                  : "Cadastre jogos para gerar análises."}
              </p>
            </div>
          </div>
          <button
            onClick={() => void requestAnalysis(Boolean(analysis))}
            disabled={!match || generateAnalysis.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-5 py-3 font-medium text-white shadow-glow disabled:opacity-40 disabled:shadow-none"
          >
            {generateAnalysis.isPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {analysis ? "Atualizar análise" : "Gerar análise IA"}
          </button>
        </div>

        {matchesLoading && <PanelMessage text="Carregando jogos..." />}
        {!matchesLoading && !match && (
          <PanelMessage text="Nenhum jogo cadastrado ainda. Crie um jogo no painel admin." />
        )}

        {match && (
          <div className="grid lg:grid-cols-3 gap-5">
            <SuggestionCard
              match={match}
              analysis={analysis}
              loading={analysisLoading || generateAnalysis.isPending}
            />
            <StatsCard match={match} />
            <InsightCard match={match} analysis={analysis} />
            <ScenarioCard analysis={analysis} />
          </div>
        )}
      </AuthGate>
    </AppLayout>
  );
}

function MatchTitle({ match }: { match: ApiMatch }) {
  return (
    <>
      {match.home_team.name} <span className="text-muted-foreground text-lg">vs</span>{" "}
      {match.away_team.name}
    </>
  );
}

function SuggestionCard({
  match,
  analysis,
  loading,
}: {
  match: ApiMatch;
  analysis?: ApiGameAnalysis;
  loading: boolean;
}) {
  const confidence = Math.round(Number(analysis?.confidence ?? 0));
  const homeProb = Math.round(Number(analysis?.payload?.probabilities?.home ?? 34));
  const drawProb = Math.round(Number(analysis?.payload?.probabilities?.draw ?? 32));
  const awayProb = Math.round(Number(analysis?.payload?.probabilities?.away ?? 34));

  return (
    <div className="lg:col-span-1 glass rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-gradient-brand opacity-30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary mb-3">
          <Sparkles className="size-3.5" /> Placar sugerido
        </div>
        <div className="flex items-center justify-center gap-5 my-6">
          <TeamMini team={match.home_team} />
          <div className="text-6xl font-display font-bold text-gradient">
            {analysis?.suggested_home_score ?? "-"}
            <span className="text-muted-foreground mx-3 text-3xl">×</span>
            {analysis?.suggested_away_score ?? "-"}
          </div>
          <TeamMini team={match.away_team} />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Nível de confiança</span>
            <span className="font-bold text-success">{loading ? "..." : `${confidence}%`}</span>
          </div>
          <div className="h-2 rounded-full bg-background/60 overflow-hidden">
            <div
              className="h-full bg-gradient-green transition-all"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            { l: "Casa", v: homeProb },
            { l: "Empate", v: drawProb },
            { l: "Fora", v: awayProb },
          ].map((item) => (
            <div key={item.l} className="rounded-lg bg-background/60 p-3">
              <div className="text-lg font-bold">{item.v}%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ match }: { match: ApiMatch }) {
  const xgData = [
    { metric: "xG", h: 1.5, a: 1.2 },
    { metric: "Posse", h: 52, a: 48 },
    { metric: "Finalizações", h: 11, a: 9 },
    { metric: "Chances claras", h: 3, a: 2 },
  ];

  return (
    <div className="lg:col-span-2 glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-5">
        <Activity className="size-5 text-primary" /> Contexto esportivo
      </h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {[match.home_team, match.away_team].map((team) => (
          <div key={team.id} className="rounded-xl bg-background/40 p-4">
            <div className="flex items-center gap-3">
              <TeamLogo team={team} />
              <div>
                <div className="font-semibold">{team.name}</div>
                <div className="text-xs text-muted-foreground">{team.short_name}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-border">
        <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" /> Estatísticas base
        </h3>
        <div className="space-y-3">
          {xgData.map((row) => {
            const total = row.h + row.a;
            const hp = (row.h / total) * 100;
            return (
              <div key={row.metric}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold">{row.h}</span>
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                    {row.metric}
                  </span>
                  <span className="font-bold">{row.a}</span>
                </div>
                <div className="h-2 rounded-full bg-background/60 overflow-hidden flex">
                  <div className="h-full bg-gradient-brand" style={{ width: `${hp}%` }} />
                  <div className="h-full bg-muted" style={{ width: `${100 - hp}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ match, analysis }: { match: ApiMatch; analysis?: ApiGameAnalysis }) {
  return (
    <div className="lg:col-span-3 glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
        <Target className="size-5 text-primary" /> Insight da IA
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {analysis?.summary ?? (
          <>
            Clique em <span className="text-foreground font-medium">Gerar análise IA</span> para
            criar uma leitura do confronto {match.home_team.name} vs {match.away_team.name}.
          </>
        )}
      </p>
      {analysis && (
        <div className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
          Fonte: {analysis.provider} · Modelo: {analysis.model}
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ analysis }: { analysis?: ApiGameAnalysis }) {
  const data = analysis
    ? [
        {
          score: `${analysis.suggested_home_score}x${analysis.suggested_away_score}`,
          prob: Math.round(Number(analysis.confidence)),
        },
        { score: "1x1", prob: 18 },
        { score: "2x1", prob: 14 },
        { score: "1x0", prob: 11 },
      ]
    : [{ score: "Aguardando", prob: 0 }];

  return (
    <div className="lg:col-span-3 glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg mb-5">Cenários alternativos prováveis</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis
              dataKey="score"
              stroke="oklch(0.72 0.03 270)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="oklch(0.72 0.03 270)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <Bar dataKey="prob" radius={[8, 8, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "oklch(0.78 0.2 150)" : "oklch(0.65 0.24 295)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TeamMini({ team }: { team: ApiTeam }) {
  return (
    <div className="text-center">
      <TeamLogo team={team} className="mx-auto" />
      <div className="text-xs text-muted-foreground mt-2">{team.short_name}</div>
    </div>
  );
}

function PanelMessage({ text }: { text: string }) {
  return <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">{text}</div>;
}
