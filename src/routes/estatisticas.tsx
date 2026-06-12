import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useRoundFeed, useStatisticsOverview } from "@/lib/api/hooks";
import {
  Activity,
  ArrowRight,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/estatisticas")({
  head: () => ({ meta: [{ title: "Estatísticas · Copa Tech" }] }),
  component: EstatisticasPage,
});

function EstatisticasPage() {
  const { data, isLoading } = useStatisticsOverview();
  const { data: roundFeed } = useRoundFeed();

  const kpis = [
    {
      label: "Participantes",
      value: data?.kpis.participants ?? 0,
      icon: Users,
      color: "from-fuchsia-500 to-purple-600",
    },
    {
      label: "Empresas",
      value: data?.kpis.companies ?? 0,
      icon: Activity,
      color: "from-emerald-400 to-teal-500",
    },
    {
      label: "Palpites",
      value: data?.kpis.predictions ?? 0,
      icon: Target,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Taxa de acerto",
      value: `${data?.kpis.accuracy ?? 0}%`,
      icon: Trophy,
      color: "from-amber-400 to-orange-500",
    },
    {
      label: "Análises IA",
      value: data?.kpis.analyses ?? 0,
      icon: Sparkles,
      color: "from-violet-500 to-fuchsia-500",
    },
    {
      label: "Jogos",
      value: data?.kpis.matches ?? 0,
      icon: BarChart3,
      color: "from-cyan-400 to-blue-500",
    },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Visão geral</div>
        <h1 className="text-3xl md:text-4xl font-bold">Estatísticas da Copa</h1>
        <p className="text-muted-foreground mt-1">Métricas em tempo real do bolão corporativo</p>
      </div>

      {isLoading && (
        <div className="glass rounded-2xl p-6 text-sm text-muted-foreground mb-6">
          Carregando estatísticas...
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-5 relative overflow-hidden">
            <div
              className={`absolute -top-8 -right-8 size-24 rounded-full bg-gradient-to-br ${color} opacity-30 blur-2xl`}
            />
            <div className="relative">
              <div
                className={`size-10 rounded-xl bg-gradient-to-br ${color} grid place-items-center mb-3`}
              >
                <Icon className="size-5 text-white" />
              </div>
              <div className="text-2xl lg:text-3xl font-display font-bold">
                {formatValue(value)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <RoundFeedSection data={roundFeed} />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" /> Atividade por dia
            </h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Palpites
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" /> IA
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Volume nos últimos 7 dias</p>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data?.daily_activity ?? []}>
                <defs>
                  <linearGradient id="gPredictions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.24 295)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.65 0.24 295)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAnalyses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.2 150)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.2 150)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.3 0.05 270 / 0.3)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
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
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="predictions"
                  name="Palpites"
                  stroke="oklch(0.65 0.24 295)"
                  strokeWidth={2.5}
                  fill="url(#gPredictions)"
                />
                <Area
                  type="monotone"
                  dataKey="analyses"
                  name="IA"
                  stroke="oklch(0.78 0.2 150)"
                  strokeWidth={2.5}
                  fill="url(#gAnalyses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
            <PieIcon className="size-5 text-primary" /> Participantes
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Distribuição por empresa</p>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data?.company_distribution ?? []}
                  dataKey="participants"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(data?.company_distribution ?? []).map((company, index) => (
                    <Cell
                      key={company.id}
                      fill={company.color ?? fallbackColors[index % fallbackColors.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] mt-2">
            {(data?.company_distribution ?? []).slice(0, 8).map((company, index) => (
              <div key={company.id} className="flex items-center gap-1.5 truncate">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{
                    background: company.color ?? fallbackColors[index % fallbackColors.length],
                  }}
                />
                <span className="truncate text-muted-foreground">
                  {company.name} · {company.participants}
                </span>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          title="Palpites por jogo"
          subtitle="Quantidade de palpites registrados em cada partida"
        >
          <BarChart data={data?.predictions_by_match ?? []}>
            <CartesianGrid
              stroke="oklch(0.3 0.05 270 / 0.3)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="oklch(0.72 0.03 270)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="oklch(0.72 0.03 270)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="predictions"
              name="Palpites"
              radius={[8, 8, 0, 0]}
              fill="oklch(0.65 0.24 295)"
            />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Placares mais apostados"
          subtitle="Quantidade de vezes que cada placar foi escolhido"
        >
          <BarChart data={data?.popular_scores ?? []}>
            <CartesianGrid
              stroke="oklch(0.3 0.05 270 / 0.3)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="score"
              stroke="oklch(0.72 0.03 270)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="oklch(0.72 0.03 270)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Apostas" radius={[8, 8, 0, 0]}>
              {(data?.popular_scores ?? []).map((_, index) => (
                <Cell key={index} fill={fallbackColors[index % fallbackColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </div>
    </AppLayout>
  );
}

function RoundFeedSection({ data }: { data?: ReturnType<typeof useRoundFeed>["data"] }) {
  const highlights = data?.highlights ?? [];
  const ranking = data?.ranking ?? [];

  return (
    <div className="grid lg:grid-cols-3 gap-5 mb-6">
      <div className="lg:col-span-2 glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
              Feed da rodada
            </div>
            <h2 className="font-display font-bold text-xl">{data?.stage ?? "Rodada atual"}</h2>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Link
              to="/rodada"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20"
            >
              Página da rodada <ArrowRight className="size-3.5" />
            </Link>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <RoundMiniStat label="Jogos" value={data?.matches ?? 0} />
              <RoundMiniStat label="Palpites" value={data?.predictions ?? 0} />
              <RoundMiniStat label="Players" value={data?.participants ?? 0} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {(highlights.length ? highlights : emptyHighlights).map((item) => (
            <div key={item.label} className="rounded-xl bg-background/45 p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                {item.label}
              </div>
              <div className="font-display font-bold text-lg">{item.value}</div>
              {item.detail && <div className="text-xs text-primary mt-1">{item.detail}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
          <Trophy className="size-5 text-primary" /> Top da rodada
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Pontuação somente nesta rodada</p>
        <div className="space-y-2">
          {ranking.length === 0 && (
            <div className="rounded-xl bg-background/45 p-4 text-sm text-muted-foreground">
              Ainda não há pontos nesta rodada.
            </div>
          )}
          {ranking.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-xl bg-background/45 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {player.rank}. {player.full_name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {player.company_name ?? "Sem empresa"} · {player.predictions} palpites
                </div>
              </div>
              <div className="font-display font-bold text-primary">{player.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoundMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-background/50 px-3 py-2">
      <div className="font-display font-bold text-base">{value.toLocaleString("pt-BR")}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactElement;
}) {
  return (
    <div className="lg:col-span-3 glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg mb-1">{title}</h2>
      <p className="text-xs text-muted-foreground mb-5">{subtitle}</p>
      <div className="h-64">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

function formatValue(value: string | number) {
  if (typeof value === "number") return value.toLocaleString("pt-BR");
  return value;
}

const fallbackColors = [
  "oklch(0.65 0.24 295)",
  "oklch(0.78 0.2 150)",
  "oklch(0.7 0.18 230)",
  "oklch(0.75 0.18 60)",
  "oklch(0.7 0.22 340)",
  "oklch(0.68 0.18 25)",
];

const emptyHighlights = [
  { label: "Jogo mais apostado", value: "Aguardando palpites", detail: null },
  { label: "Placar favorito", value: "Aguardando", detail: null },
  { label: "Maior divergência", value: "Aguardando", detail: null },
];

const tooltipStyle = {
  background: "oklch(0.21 0.045 270)",
  border: "1px solid oklch(0.32 0.05 270)",
  borderRadius: 12,
};
