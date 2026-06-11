import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useCompanyRanking } from "@/lib/api/hooks";
import { Building2, Users, Trophy } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/empresas")({
  head: () => ({ meta: [{ title: "Ranking por Empresas · Copa Tech" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { data = [], isLoading } = useCompanyRanking();
  const companyRanking = data.map((company) => ({
    rank: company.rank,
    name: company.name,
    participants: company.participants,
    totalPoints: Number(company.total_points ?? 0),
    avgPoints: Number(company.avg_points ?? 0),
    color: company.color ?? "#8b5cf6",
  }));
  const max = Math.max(1, ...companyRanking.map((c) => c.totalPoints));

  return (
    <AppLayout>
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
          Disputa entre empresas
        </div>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          Ranking por Empresas <Building2 className="size-7 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-1">
          Soma dos pontos de todos os colaboradores de cada empresa
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {isLoading && (
          <div className="lg:col-span-3 glass rounded-2xl p-6 text-sm text-muted-foreground">
            Carregando empresas...
          </div>
        )}
        {companyRanking.slice(0, 3).map((c, i) => (
          <div key={c.name} className="glass rounded-2xl p-6 relative overflow-hidden">
            <div
              className="absolute -top-10 -right-10 size-32 rounded-full blur-3xl opacity-40"
              style={{ background: c.color }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {i === 0 ? "🥇 Líder" : i === 1 ? "🥈 Vice" : "🥉 3º lugar"}
                </span>
                <span className="size-3 rounded-full" style={{ background: c.color }} />
              </div>
              <h3 className="font-display font-bold text-xl mb-1">{c.name}</h3>
              <div className="text-3xl font-display font-bold text-gradient mb-3">
                {c.totalPoints.toLocaleString("pt-BR")} pts
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" /> {c.participants} participantes
                </span>
                <span>{c.avgPoints} pts/pessoa</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
            <Trophy className="size-5 text-primary" /> Classificação completa
          </h2>
          <div className="space-y-3">
            {!isLoading && companyRanking.length === 0 && (
              <div className="rounded-xl bg-background/40 p-4 text-sm text-muted-foreground">
                Nenhuma empresa cadastrada ainda.
              </div>
            )}
            {companyRanking.map((c) => (
              <div key={c.name} className="flex items-center gap-4">
                <div className="w-6 text-sm font-bold text-muted-foreground">{c.rank}</div>
                <div
                  className="size-10 rounded-xl grid place-items-center text-white font-bold text-sm shrink-0"
                  style={{ background: c.color }}
                >
                  {c.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="font-display font-bold text-sm">
                      {c.totalPoints.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.totalPoints / max) * 100}%`,
                        background: `linear-gradient(90deg, ${c.color}, oklch(0.65 0.24 295))`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{c.participants} colaboradores</span>
                    <span>média {c.avgPoints} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-1">Comparativo</h2>
          <p className="text-xs text-muted-foreground mb-5">Pontuação total por empresa</p>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={companyRanking} layout="vertical" margin={{ left: 10 }}>
                <XAxis
                  type="number"
                  stroke="oklch(0.72 0.03 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="oklch(0.72 0.03 270)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.3 0.05 270 / 0.2)" }}
                  contentStyle={{
                    background: "oklch(0.21 0.045 270)",
                    border: "1px solid oklch(0.32 0.05 270)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="totalPoints" radius={[0, 8, 8, 0]}>
                  {companyRanking.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
