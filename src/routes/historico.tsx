import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";
import { TeamLogo } from "@/components/TeamLogo";
import { formatMatchDate, formatMatchTime } from "@/lib/api/format";
import { useMatches, useMyPredictions } from "@/lib/api/hooks";
import type { ApiMatch, ApiPrediction, ApiTeam } from "@/lib/api/types";
import { isClosed } from "@/routes/palpites";
import { ArrowRight, CheckCircle2, Clock, History, Medal, Target, Trophy, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/historico")({
  head: () => ({ meta: [{ title: "Histórico de palpites · Copa Tech" }] }),
  component: Historico,
});

type Filter = "all" | "finished" | "pending";

function Historico() {
  const { data: matches = [], isLoading: matchesLoading } = useMatches();
  const { data: predictions = [], isLoading: predictionsLoading } = useMyPredictions();
  const [filter, setFilter] = useState<Filter>("all");
  const predictionsByMatch = useMemo(
    () => new Map(predictions.map((prediction) => [prediction.match_id, prediction])),
    [predictions],
  );

  const rows = useMemo(
    () =>
      matches
        .map((match) => ({ match, prediction: predictionsByMatch.get(match.id) }))
        .filter(({ prediction }) => Boolean(prediction))
        .filter(({ match }) => {
          if (filter === "finished") return match.status === "finished";
          if (filter === "pending") return match.status !== "finished";
          return true;
        })
        .sort((a, b) => new Date(b.match.starts_at).getTime() - new Date(a.match.starts_at).getTime()),
    [filter, matches, predictionsByMatch],
  );

  const finished = rows.filter(({ match }) => match.status === "finished");
  const totalPoints = predictions.reduce((sum, prediction) => sum + Number(prediction.points ?? 0), 0);
  const exactHits = finished.filter(({ match, prediction }) => isExactHit(match, prediction)).length;
  const winnerHits = finished.filter(({ match, prediction }) => isWinnerHit(match, prediction)).length;

  return (
    <AppLayout>
      <AuthGate>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Minha trajetória</div>
            <h1 className="text-3xl md:text-4xl font-bold">Histórico de palpites</h1>
            <p className="mt-1 text-muted-foreground">
              Veja o que você apostou, resultado real e pontos por jogo.
            </p>
          </div>
          <Link
            to="/palpites"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-medium text-white shadow-glow"
          >
            Voltar aos palpites <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Pontos" value={totalPoints} icon={Trophy} />
          <SummaryCard label="Palpites" value={predictions.length} icon={Target} />
          <SummaryCard label="Placares exatos" value={exactHits} icon={Medal} />
          <SummaryCard label="Acertos de vencedor" value={winnerHits} icon={CheckCircle2} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Todos" },
            { key: "finished", label: "Finalizados" },
            { key: "pending", label: "Pendentes" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as Filter)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item.key ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {(matchesLoading || predictionsLoading) && (
            <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">Carregando histórico...</div>
          )}
          {!matchesLoading && !predictionsLoading && rows.length === 0 && (
            <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
              Nenhum palpite encontrado para este filtro.
            </div>
          )}
          {rows.map(({ match, prediction }) => (
            <HistoryCard key={match.id} match={match} prediction={prediction!} />
          ))}
        </div>
      </AuthGate>
    </AppLayout>
  );
}

function HistoryCard({ match, prediction }: { match: ApiMatch; prediction: ApiPrediction }) {
  const finished = match.status === "finished";
  const exact = isExactHit(match, prediction);
  const winner = isWinnerHit(match, prediction);
  const status = finished
    ? exact
      ? { label: "Placar exato", icon: Medal, className: "text-success bg-success/10" }
      : winner
        ? { label: "Vencedor correto", icon: CheckCircle2, className: "text-primary bg-primary/10" }
        : { label: "Não pontuou no resultado", icon: XCircle, className: "text-muted-foreground bg-muted" }
    : { label: isClosed(match) ? "Fechado" : "Aguardando jogo", icon: Clock, className: "text-warning bg-warning/10" };
  const Icon = status.icon;

  return (
    <div className="glass rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {formatMatchDate(match.starts_at)} · {formatMatchTime(match.starts_at)} · {match.stage}
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${status.className}`}>
          <Icon className="size-3.5" /> {status.label}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <TeamSide team={match.home_team} />
        <div className="rounded-xl bg-background/45 p-4 text-center">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Seu palpite</div>
          <div className="mt-1 font-display text-3xl font-bold">
            {prediction.home_score} <span className="text-muted-foreground">×</span> {prediction.away_score}
          </div>
          {finished && match.home_score != null && match.away_score != null && (
            <div className="mt-2 text-xs text-muted-foreground">
              Resultado: {match.home_score} × {match.away_score}
            </div>
          )}
        </div>
        <TeamSide team={match.away_team} align="right" />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-background/35 p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="size-4" /> Pontuação do jogo
        </div>
        <div className="font-display text-xl font-bold text-primary">{prediction.points}</div>
      </div>
    </div>
  );
}

function TeamSide({ team, align = "left" }: { team: ApiTeam; align?: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "justify-end text-right" : ""}`}>
      {align === "left" && <TeamLogo team={team} />}
      <div>
        <div className="font-semibold">{team.name}</div>
        <div className="text-xs text-muted-foreground">{team.short_name}</div>
      </div>
      {align === "right" && <TeamLogo team={team} />}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Trophy }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function isExactHit(match: ApiMatch, prediction: ApiPrediction) {
  return (
    match.status === "finished" &&
    match.home_score === prediction.home_score &&
    match.away_score === prediction.away_score
  );
}

function isWinnerHit(match: ApiMatch, prediction: ApiPrediction) {
  if (match.status !== "finished" || match.home_score == null || match.away_score == null) return false;
  return outcome(match.home_score, match.away_score) === outcome(prediction.home_score, prediction.away_score);
}

function outcome(home: number, away: number) {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}
