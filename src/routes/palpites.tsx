import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";
import { TeamLogo } from "@/components/TeamLogo";
import { ApiError, getAccessToken, startGoogleLogin } from "@/lib/api/client";
import { formatMatchDate, formatMatchTime } from "@/lib/api/format";
import { useMatches, useMyPredictions, useUpsertPrediction } from "@/lib/api/hooks";
import type { ApiMatch, ApiPrediction, ApiTeam } from "@/lib/api/types";
import { AlertCircle, Check, History, Lock, Medal, Save, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/palpites")({
  head: () => ({ meta: [{ title: "Palpites · Copa Tech" }] }),
  component: Palpites,
});

type PickState = { h: string; a: string; saved?: boolean; message?: string; error?: string };

function Palpites() {
  const { data: matches = [], isLoading } = useMatches();
  const { data: savedPredictions = [] } = useMyPredictions();
  const upsertPrediction = useUpsertPrediction();
  const [picks, setPicks] = useState<Record<string, PickState>>({});
  const predictionsByMatch = useMemo(
    () => new Map(savedPredictions.map((prediction) => [prediction.match_id, prediction])),
    [savedPredictions],
  );
  const openMatches = useMemo(() => matches.filter((match) => !isClosed(match)), [matches]);
  const lockedMatches = useMemo(
    () => matches.filter((match) => isClosed(match) && match.status !== "finished"),
    [matches],
  );
  const finishedMatches = useMemo(
    () => matches.filter((match) => match.status === "finished"),
    [matches],
  );

  useEffect(() => {
    if (savedPredictions.length === 0) return;
    setPicks((current) => {
      const next = { ...current };
      for (const prediction of savedPredictions) {
        next[prediction.match_id] = {
          ...next[prediction.match_id],
          h: String(prediction.home_score),
          a: String(prediction.away_score),
          saved: true,
          message: "Palpite salvo no backend.",
          error: undefined,
        };
      }
      return next;
    });
  }, [savedPredictions]);

  const setScore = (id: string, side: "h" | "a", value: string) => {
    setPicks((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [side]: value.replace(/\D/g, "").slice(0, 2),
        saved: false,
        message: undefined,
        error: undefined,
      },
    }));
  };

  const save = async (match: ApiMatch) => {
    const pick = picks[match.id];
    const validation = validatePick(match, pick);
    if (validation) {
      setPicks((current) => ({
        ...current,
        [match.id]: { ...current[match.id], error: validation },
      }));
      return;
    }

    if (!getAccessToken()) {
      await startGoogleLogin();
      return;
    }

    try {
      await upsertPrediction.mutateAsync({
        match_id: match.id,
        home_score: Number(pick?.h),
        away_score: Number(pick?.a),
      });
      setPicks((current) => ({
        ...current,
        [match.id]: {
          ...current[match.id],
          saved: true,
          message: "Palpite salvo com sucesso.",
          error: undefined,
        },
      }));
    } catch (error) {
      setPicks((current) => ({
        ...current,
        [match.id]: { ...current[match.id], error: humanError(error), message: undefined },
      }));
    }
  };

  return (
    <AppLayout>
      <AuthGate>
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Rodada atual</div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Seus palpites</h1>
              <p className="text-muted-foreground mt-1">
                Primeiro os jogos abertos. Encerrados ficam no histórico para consulta.
              </p>
            </div>
            <Link
              to="/historico"
              className="inline-flex items-center justify-center gap-2 rounded-xl glass px-4 py-2.5 text-sm font-medium hover:bg-primary/10 hover:border-primary/40 transition"
            >
              <History className="size-4 text-primary" /> Histórico
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading && (
            <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
              Carregando jogos...
            </div>
          )}
          {!isLoading && matches.length === 0 && (
            <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
              Nenhum jogo cadastrado para palpites.
            </div>
          )}
          <PredictionSection
            title="Abertos para palpite"
            description="Prioridade máxima: jogos que ainda aceitam edição."
            empty="Nenhum jogo aberto para palpite agora."
            matches={openMatches}
            picks={picks}
            predictionsByMatch={predictionsByMatch}
            saving={upsertPrediction.isPending}
            onScore={setScore}
            onSave={save}
          />

          {lockedMatches.length > 0 && (
            <PredictionSection
              title="Fechados"
              description="Jogos que começaram ou estão ao vivo."
              matches={lockedMatches}
              picks={picks}
              predictionsByMatch={predictionsByMatch}
              saving={upsertPrediction.isPending}
              onScore={setScore}
              onSave={save}
            />
          )}

          {finishedMatches.length > 0 && (
            <section className="pt-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">Encerrados</h2>
                  <p className="text-sm text-muted-foreground">
                    Últimos resultados. A lista completa está no histórico.
                  </p>
                </div>
                <Link to="/historico" className="text-xs text-primary hover:underline">
                  Ver histórico
                </Link>
              </div>
              <div className="space-y-4">
                {finishedMatches.slice(0, 3).map((match) => (
                  <PredictionCard
                    key={match.id}
                    match={match}
                    pick={picks[match.id] || { h: "", a: "" }}
                    prediction={predictionsByMatch.get(match.id)}
                    saving={upsertPrediction.isPending}
                    onScore={setScore}
                    onSave={() => void save(match)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </AuthGate>
    </AppLayout>
  );
}

function PredictionSection({
  title,
  description,
  empty,
  matches,
  picks,
  predictionsByMatch,
  saving,
  onScore,
  onSave,
}: {
  title: string;
  description: string;
  empty?: string;
  matches: ApiMatch[];
  picks: Record<string, PickState>;
  predictionsByMatch: Map<string, ApiPrediction>;
  saving: boolean;
  onScore: (id: string, side: "h" | "a", value: string) => void;
  onSave: (match: ApiMatch) => Promise<void>;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {matches.length === 0 && empty && (
        <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">{empty}</div>
      )}
      <div className="space-y-4">
        {matches.map((match) => (
          <PredictionCard
            key={match.id}
            match={match}
            pick={picks[match.id] || { h: "", a: "" }}
            prediction={predictionsByMatch.get(match.id)}
            saving={saving}
            onScore={onScore}
            onSave={() => void onSave(match)}
          />
        ))}
      </div>
    </section>
  );
}

function PredictionCard({
  match,
  pick,
  prediction,
  saving,
  onScore,
  onSave,
}: {
  match: ApiMatch;
  pick: PickState;
  prediction?: ApiPrediction;
  saving: boolean;
  onScore: (id: string, side: "h" | "a", value: string) => void;
  onSave: () => void;
}) {
  const closed = isClosed(match);
  const finished = match.status === "finished";
  const canSave = !closed && pick.h !== "" && pick.a !== "" && !validatePick(match, pick);
  const badge = statusBadge(match);

  return (
    <div className="glass rounded-2xl p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {formatMatchDate(match.starts_at)} · {formatMatchTime(match.starts_at)} · {match.stage}
        </div>
        <div className="flex items-center gap-2">
          {prediction && (
            <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary/15 text-primary px-2 py-0.5">
              Palpite salvo
            </span>
          )}
          <span
            className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 md:gap-6 items-center">
        <TeamSide team={match.home_team} align="right" />

        <div className="flex items-center gap-2">
          <ScoreInput
            value={pick.h}
            disabled={closed}
            onChange={(value) => onScore(match.id, "h", value)}
          />
          <span className="text-muted-foreground font-display font-bold">×</span>
          <ScoreInput
            value={pick.a}
            disabled={closed}
            onChange={(value) => onScore(match.id, "a", value)}
          />
        </div>

        <TeamSide team={match.away_team} align="left" />
      </div>

      {finished && match.home_score != null && match.away_score != null && (
        <div className="mt-5 rounded-xl bg-background/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-sm">
            Resultado final:{" "}
            <span className="font-bold text-foreground">
              {match.home_score} × {match.away_score}
            </span>
          </div>
          {prediction && (
            <div className="inline-flex items-center gap-2 text-sm text-success">
              <Medal className="size-4" /> {prediction.points} pontos
            </div>
          )}
        </div>
      )}

      {(pick.message || pick.error || closed) && (
        <div
          className={`mt-5 rounded-xl p-3 text-sm flex items-center gap-2 ${pick.error ? "bg-destructive/10 text-destructive" : "bg-background/40 text-muted-foreground"}`}
        >
          {pick.error ? (
            <AlertCircle className="size-4 shrink-0" />
          ) : closed ? (
            <Lock className="size-4 shrink-0" />
          ) : (
            <Check className="size-4 shrink-0 text-success" />
          )}
          <span>{pick.error || (closed ? "Palpites fechados para este jogo." : pick.message)}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-5 border-t border-border">
        <Link
          to="/ia"
          search={{ match: match.id }}
          className="inline-flex items-center justify-center gap-2 rounded-lg glass px-4 py-2.5 text-sm font-medium hover:bg-primary/10 hover:border-primary/40 transition"
        >
          <Sparkles className="size-4 text-primary" /> Perguntar para IA
        </Link>
        <button
          onClick={onSave}
          disabled={!canSave || saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-40 disabled:shadow-none sm:ml-auto"
        >
          {saving ? (
            "Salvando..."
          ) : pick.saved ? (
            <>
              <Check className="size-4" /> Salvo
            </>
          ) : (
            <>
              <Save className="size-4" /> Salvar palpite
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function TeamSide({ team, align }: { team: ApiTeam; align: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-3 ${align === "right" ? "justify-end" : ""}`}>
      {align === "left" && <TeamLogo team={team} />}
      <div className={align === "right" ? "text-right" : ""}>
        <div className="font-semibold">{team.name}</div>
        <div className="text-xs text-muted-foreground">
          {align === "right" ? "Casa" : "Visitante"}
        </div>
      </div>
      {align === "right" && <TeamLogo team={team} />}
    </div>
  );
}

function ScoreInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder="0"
      className="size-14 md:size-16 rounded-xl bg-background/60 border border-border text-center text-2xl md:text-3xl font-display font-bold focus:outline-none focus:border-primary focus:shadow-glow transition disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
}

export function isClosed(match: ApiMatch) {
  return match.status !== "scheduled" || new Date(match.starts_at).getTime() <= Date.now();
}

function validatePick(match: ApiMatch, pick?: PickState) {
  if (isClosed(match)) return "Este jogo já começou ou foi finalizado.";
  if (!pick || pick.h === "" || pick.a === "") return "Informe os dois placares.";
  const home = Number(pick.h);
  const away = Number(pick.a);
  if (!Number.isInteger(home) || !Number.isInteger(away)) return "Use apenas números inteiros.";
  if (home < 0 || away < 0) return "Placar não pode ser negativo.";
  if (home > 99 || away > 99) return "Placar máximo permitido é 99.";
  return null;
}

export function statusBadge(match: ApiMatch) {
  if (match.status === "finished")
    return { label: "Finalizado", className: "bg-muted text-muted-foreground" };
  if (match.status === "live")
    return { label: "Ao vivo", className: "bg-yellow-500/15 text-yellow-400" };
  if (isClosed(match)) return { label: "Fechado", className: "bg-muted text-muted-foreground" };
  return { label: "Aberto", className: "bg-success/15 text-success" };
}

function humanError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Palpites fechados para este jogo.";
    if (error.status === 401) return "Sua sessão expirou. Entre novamente.";
    return "Não foi possível salvar o palpite.";
  }
  return "Erro inesperado ao salvar.";
}
