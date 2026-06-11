import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { evolutionData } from "@/lib/mock-data";
import { toRankingPlayer } from "@/lib/api/format";
import { useIndividualRanking } from "@/lib/api/hooks";
import { Trophy, TrendingUp, TrendingDown, Minus, Crown } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking Geral · Copa Tech" }] }),
  component: RankingPage,
});

function RankingPage() {
  const { data = [], isLoading } = useIndividualRanking(100);
  const ranking = data.map(toRankingPlayer);
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Classificação</div>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          Ranking geral <Trophy className="size-7 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-1">
          Top 10 participantes da Copa Tech Onovolab 2026
        </p>
      </div>

      {/* Pódio */}
      <div
        className={`grid ${podium.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-3"} gap-3 md:gap-6 mb-8 items-end`}
      >
        {isLoading && (
          <div className="col-span-3 glass rounded-2xl p-6 text-sm text-muted-foreground">
            Carregando ranking...
          </div>
        )}
        {!isLoading && podium.length === 0 && (
          <div className="col-span-3 glass rounded-2xl p-6 text-sm text-muted-foreground">
            Ainda não há participantes no ranking.
          </div>
        )}
        {!isLoading &&
          podium.map((p, i) => {
            const positions = [
              { h: "h-32 md:h-40", grad: "from-slate-300 to-slate-500", rank: 2 },
              { h: "h-40 md:h-52", grad: "from-yellow-400 to-amber-500", rank: 1 },
              { h: "h-28 md:h-36", grad: "from-orange-400 to-orange-600", rank: 3 },
            ][podium.length === 1 ? 1 : i];
            return (
              <div key={p.rank} className="flex flex-col items-center">
                <div className="relative mb-3">
                  {positions.rank === 1 && (
                    <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 size-6 text-yellow-400" />
                  )}
                  <div
                    className={`size-16 md:size-20 rounded-full bg-gradient-to-br ${positions.grad} grid place-items-center font-display font-bold text-xl md:text-2xl text-white shadow-glow`}
                  >
                    {p.avatar}
                  </div>
                </div>
                <div className="text-center mb-3">
                  <div className="font-semibold text-sm md:text-base truncate max-w-[120px]">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{p.company}</div>
                  <div className="font-display font-bold text-lg md:text-xl mt-1">
                    {p.points} pts
                  </div>
                </div>
                <div
                  className={`w-full glass rounded-t-2xl ${positions.h} grid place-items-center font-display font-bold text-4xl md:text-5xl text-gradient`}
                >
                  {positions.rank}º
                </div>
              </div>
            );
          })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Tabela */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">Posições 4 — 10</h2>
          <div className="space-y-2">
            {!isLoading && rest.length === 0 && (
              <div className="rounded-xl bg-background/40 p-4 text-sm text-muted-foreground">
                Novas posições aparecem aqui conforme participantes entram no bolão.
              </div>
            )}
            {rest.map((p) => (
              <div
                key={p.rank}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/40 hover:bg-background/60 transition"
              >
                <div className="size-8 rounded-lg bg-muted grid place-items-center text-sm font-bold text-muted-foreground">
                  {p.rank}
                </div>
                <div className="size-10 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold text-white">
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.company} · {p.hits} acertos
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold">{p.points}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    pontos
                  </div>
                </div>
                <div className="w-12 text-right">
                  <Trend t={p.trend} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evolução */}
        <div className="lg:col-span-1 glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Evolução no ranking</h2>
          <p className="text-xs text-muted-foreground mb-5">Pontos por rodada · Top 5</p>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={evolutionData}>
                <CartesianGrid stroke="oklch(0.3 0.05 270 / 0.3)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="round"
                  stroke="oklch(0.72 0.03 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.72 0.03 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.045 270)",
                    border: "1px solid oklch(0.32 0.05 270)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Mariana"
                  stroke="oklch(0.78 0.2 150)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Rafael"
                  stroke="oklch(0.65 0.24 295)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Juliana"
                  stroke="oklch(0.7 0.18 230)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Carlos"
                  stroke="oklch(0.75 0.18 60)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Beatriz"
                  stroke="oklch(0.7 0.22 340)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Trend({ t }: { t: number }) {
  if (t > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-success">
        <TrendingUp className="size-3" />
        {t}
      </span>
    );
  if (t < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-destructive">
        <TrendingDown className="size-3" />
        {Math.abs(t)}
      </span>
    );
  return (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      <Minus className="size-3" />
    </span>
  );
}
