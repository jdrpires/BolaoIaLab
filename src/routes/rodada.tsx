import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useIndividualRanking, useRoundFeed, useRoundRanking } from "@/lib/api/hooks";
import type { ApiRoundFeed } from "@/lib/api/types";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Medal,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/rodada")({
  head: () => ({ meta: [{ title: "Rodada · Copa Tech" }] }),
  component: RodadaPage,
});

function RodadaPage() {
  const { data: feed, isLoading: feedLoading } = useRoundFeed();
  const { data: roundRanking = [], isLoading: roundLoading } = useRoundRanking(feed?.stage, 20);
  const { data: generalRanking = [], isLoading: generalLoading } = useIndividualRanking(20);
  const bestPredictions = feed?.best_predictions ?? [];

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
            <CalendarDays className="size-4" /> Rodada
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{feed?.stage ?? "Rodada atual"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranking da rodada, comparação com o geral e os palpites que mais pontuaram.
          </p>
        </div>
        <Link
          to="/estatisticas"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Ver estatísticas <ArrowRight className="size-4" />
        </Link>
      </div>

      {feedLoading && (
        <div className="glass mb-6 rounded-2xl p-6 text-sm text-muted-foreground">
          Carregando dados da rodada...
        </div>
      )}

      <RoundHero feed={feed} />

      <div className="grid gap-5 lg:grid-cols-2">
        <RankingPanel
          title="Ranking da rodada"
          subtitle="Pontuação somada apenas nesta fase"
          icon={<Medal className="size-5 text-primary" />}
          players={roundRanking.length ? roundRanking : feed?.ranking ?? []}
          loading={roundLoading}
          empty="Ainda não há pontuação nesta rodada."
        />
        <RankingPanel
          title="Ranking geral"
          subtitle="Pontuação acumulada em todo o bolão"
          icon={<Trophy className="size-5 text-primary" />}
          players={generalRanking}
          loading={generalLoading}
          empty="Ainda não há ranking geral."
        />
      </div>

      <section className="glass mt-5 rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display flex items-center gap-2 text-xl font-bold">
              <Sparkles className="size-5 text-primary" /> Melhores palpites da rodada
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Palpites já pontuados, ordenados por pontos.
            </p>
          </div>
        </div>
        {bestPredictions.length === 0 ? (
          <div className="rounded-xl bg-background/45 p-5 text-sm text-muted-foreground">
            Os melhores palpites aparecem aqui quando houver jogos finalizados e pontuação calculada.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bestPredictions.map((prediction) => (
              <div key={prediction.id} className="rounded-xl border border-border bg-background/45 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{prediction.full_name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {prediction.company_name ?? "Sem empresa"}
                    </div>
                  </div>
                  <div className="font-display text-2xl font-bold text-primary">
                    {prediction.points}
                  </div>
                </div>
                <div className="rounded-lg bg-background/60 p-3 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {prediction.match_label}
                  </div>
                  <div className="mt-1 text-lg font-bold">{prediction.predicted_score}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Resultado: {prediction.result_score ?? "pendente"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function RoundHero({ feed }: { feed?: ApiRoundFeed }) {
  const cards = [
    { label: "Jogos", value: feed?.matches ?? 0, icon: CalendarDays },
    { label: "Palpites", value: feed?.predictions ?? 0, icon: Target },
    { label: "Participantes", value: feed?.participants ?? 0, icon: Users },
  ];

  return (
    <div className="mb-5 grid gap-4 md:grid-cols-3">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="glass rounded-2xl p-5">
          <div className="mb-3 grid size-10 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Icon className="size-5 text-white" />
          </div>
          <div className="font-display text-3xl font-bold">{value.toLocaleString("pt-BR")}</div>
          <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}

function RankingPanel({
  title,
  subtitle,
  icon,
  players,
  loading,
  empty,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  players: RankingPlayer[];
  loading: boolean;
  empty: string;
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/15">{icon}</div>
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {loading && <div className="rounded-xl bg-background/45 p-4 text-sm text-muted-foreground">Carregando...</div>}
      {!loading && players.length === 0 && (
        <div className="rounded-xl bg-background/45 p-4 text-sm text-muted-foreground">{empty}</div>
      )}
      <div className="space-y-2">
        {players.map((player) => (
          <div key={player.id} className="flex items-center justify-between rounded-xl bg-background/45 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {player.rank}. {player.full_name}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {player.company_name ?? "Sem empresa"} · {player.predictions} palpites
              </div>
            </div>
            <div className="font-display text-xl font-bold text-primary">{Number(player.points ?? 0)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

type RankingPlayer = {
  id: string;
  full_name: string;
  company_name: string | null;
  points: number;
  predictions: number;
  rank: number;
};
