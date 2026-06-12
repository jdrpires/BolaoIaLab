import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";
import { TeamLogo } from "@/components/TeamLogo";
import { getAccessToken, startGoogleLogin } from "@/lib/api/client";
import { formatMatchDate, formatMatchTime } from "@/lib/api/format";
import { useGenerateMatchAnalysis, useMatchAnalysis, useMatches } from "@/lib/api/hooks";
import type { ApiAnalysisPrediction, ApiGameAnalysis, ApiMatch, ApiTeam } from "@/lib/api/types";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Database,
  Gauge,
  ListChecks,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

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
            <PredictionVariantCards match={match} analysis={analysis} />
            <RiskCard analysis={analysis} />
            <FactorsCard analysis={analysis} />
            <StatsCard match={match} analysis={analysis} />
            <InsightCard match={match} analysis={analysis} />
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
  const confidence = toPercent(analysis?.confidence ?? 0);
  const homeProb = toPercent(
    analysis?.payload?.probabilities?.home ?? analysis?.payload?.probabilities?.home_win ?? 34,
  );
  const drawProb = toPercent(analysis?.payload?.probabilities?.draw ?? 32);
  const awayProb = toPercent(
    analysis?.payload?.probabilities?.away ?? analysis?.payload?.probabilities?.away_win ?? 34,
  );

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

function PredictionVariantCards({
  match,
  analysis,
}: {
  match: ApiMatch;
  analysis?: ApiGameAnalysis;
}) {
  const conservative = normalizePrediction(analysis?.payload?.conservative_prediction, {
    label: "Palpite conservador",
    home_score: analysis?.suggested_home_score ?? 1,
    away_score: analysis?.suggested_away_score ?? 1,
    rationale: "Cenário mais seguro com base na probabilidade principal da análise.",
  });
  const bold = normalizePrediction(analysis?.payload?.bold_prediction, {
    label: "Palpite ousado",
    home_score: Math.max(0, (analysis?.suggested_home_score ?? 1) + 1),
    away_score: analysis?.suggested_away_score ?? 0,
    rationale: "Cenário de maior retorno caso o time com leve vantagem consiga impor ritmo.",
  });

  return (
    <div className="lg:col-span-2 grid md:grid-cols-2 gap-5">
      <PredictionCard
        icon={<ShieldCheck className="size-5 text-success" />}
        tone="success"
        title={conservative.label || "Palpite conservador"}
        prediction={conservative}
        home={match.home_team.short_name}
        away={match.away_team.short_name}
      />
      <PredictionCard
        icon={<Rocket className="size-5 text-primary" />}
        tone="primary"
        title={bold.label || "Palpite ousado"}
        prediction={bold}
        home={match.home_team.short_name}
        away={match.away_team.short_name}
      />
    </div>
  );
}

function PredictionCard({
  icon,
  tone,
  title,
  prediction,
  home,
  away,
}: {
  icon: ReactNode;
  tone: "primary" | "success";
  title: string;
  prediction: Required<ApiAnalysisPrediction>;
  home: string;
  away: string;
}) {
  const toneClass = tone === "success" ? "bg-success/15 text-success" : "bg-primary/15 text-primary";
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`grid size-10 place-items-center rounded-lg ${toneClass}`}>{icon}</div>
        <div>
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {home} x {away}
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-background/50 p-5 text-center">
        <div className="text-5xl font-display font-bold">
          {prediction.home_score}
          <span className="mx-3 text-2xl text-muted-foreground">×</span>
          {prediction.away_score}
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{prediction.rationale}</p>
    </div>
  );
}

function RiskCard({ analysis }: { analysis?: ApiGameAnalysis }) {
  const risk = analysis?.payload?.upset_risk;
  const level = String(risk?.level ?? "médio");
  const percentage = toPercent(risk?.percentage ?? 30);
  const rationale =
    risk?.rationale ??
    "A zebra depende de variáveis de baixa previsibilidade, como escalação, momento do jogo e eficiência nas poucas chances.";

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid size-10 place-items-center rounded-lg bg-warning/15 text-warning">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">Risco de zebra</h2>
          <p className="text-xs text-muted-foreground">Probabilidade de roteiro fora do esperado.</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-4xl font-display font-bold">{percentage}%</div>
          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-warning">{level}</div>
        </div>
        <Gauge className="size-12 text-muted-foreground" />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/60">
        <div className="h-full bg-warning" style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{rationale}</p>
    </div>
  );
}

function FactorsCard({ analysis }: { analysis?: ApiGameAnalysis }) {
  const factors = normalizeFactors(analysis);

  return (
    <div className="lg:col-span-2 glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-5">
        <ListChecks className="size-5 text-primary" /> Fatores da análise
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {factors.map((factor) => (
          <div key={factor.title} className="rounded-xl border border-border bg-background/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{factor.title}</h3>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-wider text-primary">
                {factor.impact}
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{factor.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsCard({ match, analysis }: { match: ApiMatch; analysis?: ApiGameAnalysis }) {
  const availability = analysis?.payload?.sports_data_available;
  const dataSources = analysis?.payload?.data_sources;
  const hasApiFootball = Boolean(availability?.api_football || dataSources?.api_football);
  const hasStats = Boolean(availability?.statistics || dataSources?.statistics);
  const sourceItems = [
    {
      label: "Fixture API-Football",
      active: Boolean(availability?.fixture || dataSources?.fixture),
    },
    {
      label: "Estatísticas reais",
      active: hasStats,
    },
    {
      label: "Inferência IA",
      active: Boolean(dataSources?.ai_inference ?? analysis),
    },
  ];

  return (
    <div className="lg:col-span-2 glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-5">
        <Activity className="size-5 text-primary" /> Dados esportivos usados
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
          <Database className="size-4 text-primary" /> Fontes disponíveis
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {sourceItems.map((item) => (
            <div key={item.label} className="rounded-lg bg-background/50 p-3">
              <div className={`text-sm font-semibold ${item.active ? "text-success" : "text-muted-foreground"}`}>
                {item.active ? "Disponível" : "Não disponível"}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {hasStats
            ? `A análise considerou estatísticas reais da API-Football${
                availability?.statistics_teams ? ` para ${availability.statistics_teams} times` : ""
              }.`
            : hasApiFootball
              ? "A análise encontrou a fixture na API-Football, mas ainda não recebeu estatísticas detalhadas desse jogo."
              : "Este jogo ainda não possui dados reais da API-Football vinculados; a IA usa contexto do confronto e inferência."}
        </p>
      </div>
    </div>
  );
}

function InsightCard({ match, analysis }: { match: ApiMatch; analysis?: ApiGameAnalysis }) {
  return (
    <div className="lg:col-span-3 glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
        <Target className="size-5 text-primary" /> Resumo executivo
      </h2>
      <div className="rounded-xl bg-background/45 p-5">
        <p className="text-sm leading-7 text-muted-foreground">
          {analysis?.summary ?? (
            <>
              Clique em <span className="text-foreground font-medium">Gerar análise IA</span> para
              criar uma leitura em cards do confronto {match.home_team.name} vs {match.away_team.name}.
            </>
          )}
        </p>
      </div>
      {analysis && (
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Fonte: {analysis.provider}</span>
          <span>·</span>
          <span>Modelo: {analysis.model}</span>
        </div>
      )}
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

function normalizePrediction(
  value: ApiAnalysisPrediction | undefined,
  fallback: Required<ApiAnalysisPrediction>,
): Required<ApiAnalysisPrediction> {
  return {
    label: value?.label || fallback.label,
    home_score: Number.isFinite(value?.home_score) ? Number(value?.home_score) : fallback.home_score,
    away_score: Number.isFinite(value?.away_score) ? Number(value?.away_score) : fallback.away_score,
    rationale: value?.rationale || fallback.rationale,
  };
}

function normalizeFactors(analysis?: ApiGameAnalysis) {
  const factors = analysis?.payload?.factors ?? [];
  if (factors.length > 0) {
    return factors.map((factor, index) => ({
      title: factor.title || `Fator ${index + 1}`,
      impact: factor.impact || "neutro",
      explanation:
        factor.explanation ||
        "A IA considerou este ponto na composição das probabilidades do confronto.",
    }));
  }

  return [
    {
      title: "Probabilidade principal",
      impact: "neutro",
      explanation: "A leitura inicial combina favoritismo, empate e chance do visitante.",
    },
    {
      title: "Dados reais",
      impact: "neutro",
      explanation: "Quando disponíveis, estatísticas da API-Football entram como base da análise.",
    },
    {
      title: "Incerteza do jogo",
      impact: "neutro",
      explanation: "Escalações, momento da partida e eficiência nas finalizações podem mudar o cenário.",
    },
    {
      title: "Mando e contexto",
      impact: "casa",
      explanation: "O mando de campo pode influenciar ritmo, pressão e controle emocional.",
    },
  ];
}

function toPercent(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric <= 1 ? numeric * 100 : numeric);
}
