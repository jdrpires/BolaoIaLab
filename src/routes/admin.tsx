import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";
import { TeamLogo } from "@/components/TeamLogo";
import {
  useAuditEvents,
  useCreateCompany,
  useCreateMatch,
  useCreateTeam,
  useCompanies,
  useMatches,
  useNotifications,
  useOperationalHealth,
  useRecalculateMatch,
  useSendMatchReminder,
  useSendMatchResult,
  useSendRanking,
  useSendUpcomingReminders,
  useSyncFixtures,
  useSyncResults,
  useTeams,
  useUpdateCompany,
  useUpdateMatch,
  useUpdateMatchResult,
  useUpdateTeam,
  useUpdateUser,
  useUsers,
} from "@/lib/api/hooks";
import { formatMatchDate, formatMatchTime } from "@/lib/api/format";
import type {
  ApiAuditEvent,
  ApiCompany,
  ApiFixtureSyncResult,
  ApiMatch,
  ApiTeam,
  ApiUser,
} from "@/lib/api/types";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  Building2,
  CalendarPlus,
  CloudDownload,
  Database,
  HeartPulse,
  History,
  RefreshCw,
  Send,
  Shield,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Copa Tech" }] }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppLayout>
      <AuthGate requireAdmin>
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Operação</div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            Painel admin <Shield className="size-7 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre entidades essenciais e publique resultados sem tocar no banco.
          </p>
        </div>

        <OperationalHealthPanel />
        <AuditTrailPanel />

        <div className="grid xl:grid-cols-2 gap-5">
          <CompanyForm />
          <TeamForm />
          <MatchForm />
          <ApiFootballPanel />
          <ResultForm />
        </div>

        <div className="mt-6 grid xl:grid-cols-2 gap-5">
          <WhatsAppPanel />
          <NotificationHistory />
          <CompanyList />
          <TeamList />
          <MatchList />
          <UserList />
        </div>
      </AuthGate>
    </AppLayout>
  );
}

function AuditTrailPanel() {
  const { data: events = [], isLoading, refetch, isFetching } = useAuditEvents(60);

  return (
    <AdminCard
      title="Histórico de ações importantes"
      icon={History}
      action={
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
          disabled={isFetching}
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </button>
      }
    >
      {isLoading && <div className="text-sm text-muted-foreground">Carregando ações...</div>}
      {!isLoading && events.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhuma ação importante registrada ainda.
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-3">
        {events.map((event) => (
          <div key={event.id} className="rounded-md border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{auditActionLabel(event.action)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {event.actor?.full_name ?? "Sistema"} · {formatDateTime(event.created_at)}
                </div>
              </div>
              <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {event.target_type}
              </span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{auditEventSummary(event)}</div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function OperationalHealthPanel() {
  const { data, isLoading, refetch, isFetching } = useOperationalHealth();

  const cards = [
    {
      label: "API",
      value: data?.api.status ?? "online",
      detail: data?.api.environment ?? "local",
      healthy: data?.api.status === "online",
      icon: HeartPulse,
    },
    {
      label: "WhatsApp",
      value: data?.whatsapp.connected ? "conectado" : data?.whatsapp.status ?? "indisponível",
      detail: data?.whatsapp.provider ?? "baileys",
      healthy: Boolean(data?.whatsapp.connected),
      icon: Bell,
    },
    {
      label: "Scheduler",
      value: data?.scheduler.enabled ? "ativo" : "pausado",
      detail: data ? `${data.scheduler.interval_seconds}s · janela ${data.scheduler.window_minutes}min` : "carregando",
      healthy: Boolean(data?.scheduler.enabled),
      icon: Activity,
    },
    {
      label: "API-Football",
      value: data?.api_football.status === "synced" ? "sincronizada" : "pendente",
      detail: data?.api_football.last_sync_at
        ? formatDateTime(data.api_football.last_sync_at)
        : data?.api_football.detail ?? "sem sync",
      healthy: data?.api_football.status === "synced",
      icon: Database,
    },
    {
      label: "OpenAI",
      value: data?.openai.status === "generated" ? "com análises" : "sem análise",
      detail: data?.openai.last_analysis_at
        ? `${formatDateTime(data.openai.last_analysis_at)} · ${data.openai.model ?? "modelo"}`
        : data?.openai.detail ?? "sem análise",
      healthy: data?.openai.status === "generated",
      icon: Bot,
    },
  ];

  return (
    <section className="glass mb-6 rounded-2xl p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold">
            <HeartPulse className="size-5 text-primary" /> Saúde operacional
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Status das integrações críticas e sinais recentes da operação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/15 px-3 py-2 text-sm font-medium text-primary disabled:opacity-40"
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl bg-background/45 p-4 text-sm text-muted-foreground">
          Carregando saúde operacional...
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {cards.map(({ label, value, detail, healthy, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-background/45 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className={`grid size-9 place-items-center rounded-lg ${healthy ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    <Icon className="size-4" />
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wider ${healthy ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    {healthy ? "ok" : "atenção"}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-bold">{value}</div>
                <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{detail}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl bg-background/45 p-4">
              <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Últimos sinais
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <Signal label="Última sync" value={data.api_football.last_sync_at ? formatDateTime(data.api_football.last_sync_at) : "Sem registro"} />
                <Signal label="Última IA" value={data.openai.last_analysis_at ? formatDateTime(data.openai.last_analysis_at) : "Sem registro"} />
                <Signal label="Scheduler" value={data.scheduler.last_run_evidence_at ? formatDateTime(data.scheduler.last_run_evidence_at) : "Sem envio ainda"} />
              </div>
            </div>
            <div className="rounded-xl bg-background/45 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="size-4 text-warning" /> Últimos erros
              </div>
              {data.errors.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum erro recente registrado.</div>
              ) : (
                <div className="space-y-2">
                  {data.errors.slice(0, 3).map((error) => (
                    <div key={`${error.created_at}-${error.destination ?? error.message}`} className="rounded-lg bg-background/50 p-3">
                      <div className="text-xs font-semibold text-warning">{error.status}</div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">{error.message}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(error.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function CompanyList() {
  const { data: companies = [] } = useCompanies();
  const updateCompany = useUpdateCompany();

  return (
    <AdminCard title="Empresas cadastradas" icon={Building2}>
      <div className="space-y-3">
        {companies.map((company) => (
          <form
            key={company.id}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void updateCompany.mutateAsync({
                companyId: company.id,
                payload: {
                  name: String(form.get("name")),
                  slug: String(form.get("slug")),
                  domain: String(form.get("domain") || "") || null,
                  color: String(form.get("color") || company.color || "#8b5cf6"),
                  is_active: form.get("is_active") === "on",
                },
              });
            }}
            className="rounded-xl bg-background/40 p-3 space-y-2"
          >
            <div className="grid md:grid-cols-[1fr_0.8fr] gap-2">
              <InlineInput name="name" defaultValue={company.name} />
              <InlineInput name="slug" defaultValue={company.slug} />
            </div>
            <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-center">
              <InlineInput
                name="domain"
                defaultValue={company.domain ?? ""}
                placeholder="domínio"
              />
              <input
                name="color"
                type="color"
                defaultValue={company.color ?? "#8b5cf6"}
                className="h-9 w-14 rounded-lg bg-background/60 border border-border"
              />
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input name="is_active" type="checkbox" defaultChecked={company.is_active} /> Ativa
              </label>
            </div>
            <RowButton label="Salvar empresa" loading={updateCompany.isPending} />
          </form>
        ))}
      </div>
    </AdminCard>
  );
}

function ApiFootballPanel() {
  const syncFixtures = useSyncFixtures();
  const syncResults = useSyncResults();
  const [league, setLeague] = useState("");
  const [season, setSeason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [team, setTeam] = useState("");
  const [lastResult, setLastResult] = useState<ApiFixtureSyncResult | null>(null);

  const submitFixtures = async (event: FormEvent) => {
    event.preventDefault();
    const result = await syncFixtures.mutateAsync({
      league: league ? Number(league) : null,
      season: season ? Number(season) : null,
      from_date: fromDate || null,
      to_date: toDate || null,
      team: team ? Number(team) : null,
    });
    setLastResult(result);
  };

  const submitResults = async () => {
    const result = await syncResults.mutateAsync();
    setLastResult(result);
  };

  return (
    <AdminCard title="API-Football" icon={CloudDownload}>
      <form onSubmit={(event) => void submitFixtures(event)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Liga"
            type="number"
            value={league}
            onChange={setLeague}
            placeholder="Padrão do .env"
            required={false}
          />
          <TextInput
            label="Temporada"
            type="number"
            value={season}
            onChange={setSeason}
            placeholder="Padrão do .env"
            required={false}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="De"
            type="date"
            value={fromDate}
            onChange={setFromDate}
            placeholder="Opcional"
          />
          <TextInput
            label="Até"
            type="date"
            value={toDate}
            onChange={setToDate}
            placeholder="Opcional"
          />
        </div>
        <TextInput
          label="Time API-Football"
          type="number"
          value={team}
          onChange={setTeam}
          placeholder="Opcional"
        />
        <div className="grid md:grid-cols-2 gap-2">
          <button
            type="submit"
            disabled={syncFixtures.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/20 px-3 py-2.5 text-sm text-primary disabled:opacity-40"
          >
            <CloudDownload className="size-4" /> Sincronizar fixtures
          </button>
          <button
            type="button"
            disabled={syncResults.isPending}
            onClick={() => void submitResults()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-success/15 px-3 py-2.5 text-sm text-success disabled:opacity-40"
          >
            <RefreshCw className="size-4" /> Atualizar resultados
          </button>
        </div>
        {lastResult && <SyncResult result={lastResult} />}
      </form>
    </AdminCard>
  );
}

function SyncResult({ result }: { result: ApiFixtureSyncResult }) {
  const items = [
    ["Fixtures", result.fixtures_checked],
    ["Times novos", result.teams_created],
    ["Times atualizados", result.teams_updated],
    ["Jogos novos", result.matches_created],
    ["Jogos atualizados", result.matches_updated],
    ["Resultados", result.results_updated],
    ["Palpites pontuados", result.predictions_scored],
    ["Ignorados", result.skipped],
  ];

  return (
    <div className="rounded-xl bg-background/40 p-3">
      {result.message && <div className="mb-2 text-xs text-muted-foreground">{result.message}</div>}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg bg-background/40 px-2 py-1.5"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamList() {
  const { data: teams = [] } = useTeams();
  const updateTeam = useUpdateTeam();

  return (
    <AdminCard title="Times cadastrados" icon={Users}>
      <div className="space-y-3">
        {teams.map((team) => (
          <form
            key={team.id}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void updateTeam.mutateAsync({
                teamId: team.id,
                payload: {
                  name: String(form.get("name")),
                  short_name: String(form.get("short_name")),
                  external_id: String(form.get("external_id") || "") || null,
                  logo_url: String(form.get("logo_url") || "") || null,
                },
              });
            }}
            className="rounded-xl bg-background/40 p-3 space-y-2"
          >
            <div className="grid md:grid-cols-[auto_1fr_90px] gap-2 items-center">
              <TeamLogo team={team} size="sm" />
              <InlineInput name="name" defaultValue={team.name} />
              <InlineInput name="short_name" defaultValue={team.short_name} />
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <InlineInput
                name="external_id"
                defaultValue={team.external_id ?? ""}
                placeholder="ID externo"
              />
              <InlineInput
                name="logo_url"
                defaultValue={team.logo_url ?? ""}
                placeholder="logo URL"
              />
            </div>
            <RowButton label="Salvar time" loading={updateTeam.isPending} />
          </form>
        ))}
      </div>
    </AdminCard>
  );
}

function MatchList() {
  const { data: matches = [] } = useMatches();
  const { data: teams = [] } = useTeams();
  const updateMatch = useUpdateMatch();
  const updateResult = useUpdateMatchResult();
  const recalculate = useRecalculateMatch();

  return (
    <AdminCard title="Jogos cadastrados" icon={CalendarPlus}>
      <div className="space-y-3">
        {matches.map((match) => (
          <form
            key={match.id}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void updateMatch.mutateAsync({
                matchId: match.id,
                payload: {
                  home_team_id: String(form.get("home_team_id")),
                  away_team_id: String(form.get("away_team_id")),
                  starts_at: new Date(String(form.get("starts_at"))).toISOString(),
                  stage: String(form.get("stage")),
                  external_fixture_id: String(form.get("external_fixture_id") || "") || null,
                  status: String(form.get("status")) as ApiMatch["status"],
                },
              });
            }}
            className="rounded-xl bg-background/40 p-3 space-y-2"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TeamLogo team={match.home_team} size="sm" />
              <span>
                {formatMatchDate(match.starts_at)} · {match.home_team.short_name} x{" "}
                {match.away_team.short_name}
              </span>
              <TeamLogo team={match.away_team} size="sm" />
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <InlineSelect
                name="home_team_id"
                defaultValue={match.home_team.id}
                options={teams.map(teamOption)}
              />
              <InlineSelect
                name="away_team_id"
                defaultValue={match.away_team.id}
                options={teams.map(teamOption)}
              />
            </div>
            <div className="grid md:grid-cols-[1fr_1fr_120px] gap-2">
              <InlineInput
                name="starts_at"
                type="datetime-local"
                defaultValue={toDatetimeLocal(match.starts_at)}
              />
              <InlineInput name="stage" defaultValue={match.stage} />
              <InlineSelect
                name="status"
                defaultValue={match.status}
                options={[
                  { value: "scheduled", label: "Aberto" },
                  { value: "live", label: "Ao vivo" },
                  { value: "finished", label: "Finalizado" },
                  { value: "cancelled", label: "Cancelado" },
                ]}
              />
            </div>
            <InlineInput
              name="external_fixture_id"
              defaultValue={match.external_fixture_id ?? ""}
              placeholder="Fixture ID"
            />
            <div className="grid md:grid-cols-[1fr_1fr_auto_auto_auto] gap-2">
              <InlineInput
                name="home_score"
                type="number"
                defaultValue={match.home_score?.toString() ?? ""}
                placeholder="Casa"
              />
              <InlineInput
                name="away_score"
                type="number"
                defaultValue={match.away_score?.toString() ?? ""}
                placeholder="Fora"
              />
              <button
                type="button"
                onClick={(event) => {
                  const form = new FormData(event.currentTarget.form!);
                  void updateResult.mutateAsync({
                    matchId: match.id,
                    payload: {
                      home_score: Number(form.get("home_score")),
                      away_score: Number(form.get("away_score")),
                    },
                  });
                }}
                className="rounded-lg bg-primary/20 px-3 py-2 text-xs text-primary disabled:opacity-40"
                disabled={updateResult.isPending}
              >
                Resultado
              </button>
              <button
                type="button"
                onClick={() => void recalculate.mutateAsync(match.id)}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-success/15 px-3 py-2 text-xs text-success disabled:opacity-40"
                disabled={recalculate.isPending}
              >
                <RefreshCw className="size-3" /> Recalcular
              </button>
              <RowButton label="Salvar" loading={updateMatch.isPending} compact />
            </div>
          </form>
        ))}
      </div>
    </AdminCard>
  );
}

function UserList() {
  const { data: users = [] } = useUsers();
  const { data: companies = [] } = useCompanies();
  const updateUser = useUpdateUser();

  return (
    <AdminCard title="Usuários" icon={UserCog}>
      <div className="space-y-3">
        {users.map((user) => (
          <form
            key={user.id}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void updateUser.mutateAsync({
                userId: user.id,
                payload: {
                  role: String(form.get("role")) as ApiUser["role"],
                  company_id: String(form.get("company_id") || "") || null,
                  phone_number: String(form.get("phone_number") || "") || null,
                  is_active: form.get("is_active") === "on",
                },
              });
            }}
            className="rounded-xl bg-background/40 p-3 space-y-2"
          >
            <div>
              <div className="font-medium text-sm">{user.full_name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <div className="grid md:grid-cols-[120px_1fr_auto] gap-2 items-center">
              <InlineSelect
                name="role"
                defaultValue={user.role}
                options={[
                  { value: "player", label: "Player" },
                  { value: "admin", label: "Admin" },
                ]}
              />
              <InlineSelect
                name="company_id"
                defaultValue={user.company_id ?? ""}
                options={[
                  { value: "", label: "Sem empresa" },
                  ...companies.map((company) => ({ value: company.id, label: company.name })),
                ]}
              />
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input name="is_active" type="checkbox" defaultChecked /> Ativo
              </label>
            </div>
            <InlineInput
              name="phone_number"
              defaultValue={user.phone_number ?? ""}
              placeholder="WhatsApp com DDD, ex: 16999999999"
            />
            <RowButton
              label={user.role === "admin" ? "Salvar usuário" : "Salvar/promover"}
              loading={updateUser.isPending}
            />
          </form>
        ))}
      </div>
    </AdminCard>
  );
}

function WhatsAppPanel() {
  const { data: matches = [] } = useMatches();
  const sendReminder = useSendMatchReminder();
  const sendUpcoming = useSendUpcomingReminders();
  const sendResult = useSendMatchResult();
  const sendRanking = useSendRanking();
  const [matchId, setMatchId] = useState("");
  const [minutes, setMinutes] = useState("60");
  const selected = matches.find((match) => match.id === matchId);

  return (
    <AdminCard title="WhatsApp" icon={Bell}>
      <div className="space-y-3">
        <SelectInput
          label="Jogo para mensagem"
          value={matchId}
          onChange={setMatchId}
          options={matches.map((match) => ({
            value: match.id,
            label: `${formatMatchDate(match.starts_at)} ${formatMatchTime(match.starts_at)} · ${match.home_team.short_name} x ${match.away_team.short_name}`,
          }))}
        />
        {selected && (
          <p className="rounded-lg bg-background/40 p-3 text-xs text-muted-foreground">
            {selected.home_team.name} vs {selected.away_team.name}
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!matchId || sendReminder.isPending}
            onClick={() => void sendReminder.mutateAsync(matchId)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/20 px-3 py-2.5 text-sm text-primary disabled:opacity-40"
          >
            <Send className="size-4" /> Lembrete deste jogo
          </button>
          <button
            type="button"
            disabled={!matchId || sendResult.isPending}
            onClick={() => void sendResult.mutateAsync(matchId)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-success/15 px-3 py-2.5 text-sm text-success disabled:opacity-40"
          >
            <Trophy className="size-4" /> Resultado do jogo
          </button>
        </div>
        <div className="grid md:grid-cols-[1fr_auto] gap-2">
          <TextInput
            label="Janela automática em minutos"
            type="number"
            value={minutes}
            onChange={setMinutes}
            min={1}
          />
          <button
            type="button"
            disabled={sendUpcoming.isPending}
            onClick={() => void sendUpcoming.mutateAsync(Number(minutes || 60))}
            className="self-end inline-flex items-center justify-center gap-2 rounded-lg bg-primary/20 px-3 py-2.5 text-sm text-primary disabled:opacity-40"
          >
            <Bell className="size-4" /> Enviar próximos
          </button>
        </div>
        <button
          type="button"
          disabled={sendRanking.isPending}
          onClick={() => void sendRanking.mutateAsync()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-40"
        >
          <Trophy className="size-4" /> Enviar ranking atual
        </button>
      </div>
    </AdminCard>
  );
}

function NotificationHistory() {
  const { data: notifications = [] } = useNotifications();

  return (
    <AdminCard title="Histórico de notificações" icon={History}>
      <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
        {notifications.length === 0 && (
          <div className="rounded-xl bg-background/40 p-4 text-sm text-muted-foreground">
            Nenhuma notificação enviada ainda.
          </div>
        )}
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-xl bg-background/40 p-3">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {notification.channel} · {notification.destination}
              </div>
              <span
                className={`text-[10px] uppercase rounded-full px-2 py-0.5 ${notification.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}
              >
                {notification.status}
              </span>
            </div>
            <div className="text-sm line-clamp-2">{notification.message}</div>
            <div className="text-[11px] text-muted-foreground mt-2">
              {new Date(notification.created_at).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function CompanyForm() {
  const createCompany = useCreateCompany();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [color, setColor] = useState("#8b5cf6");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await createCompany.mutateAsync({ name, slug, domain: domain || null, color });
    setName("");
    setSlug("");
    setDomain("");
  };

  return (
    <AdminCard title="Nova empresa" icon={Building2}>
      <form onSubmit={(event) => void submit(event)} className="space-y-3">
        <TextInput label="Nome" value={name} onChange={setName} placeholder="Onovolab" />
        <TextInput label="Slug" value={slug} onChange={setSlug} placeholder="onovolab" />
        <TextInput
          label="Domínio de e-mail"
          value={domain}
          onChange={setDomain}
          placeholder="onovolab.com.br"
        />
        <label className="block text-xs text-muted-foreground">
          Cor
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg bg-background/60 border border-border"
          />
        </label>
        <SubmitButton label="Criar empresa" loading={createCompany.isPending} />
      </form>
    </AdminCard>
  );
}

function TeamForm() {
  const createTeam = useCreateTeam();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [externalId, setExternalId] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await createTeam.mutateAsync({ name, short_name: shortName, external_id: externalId || null });
    setName("");
    setShortName("");
    setExternalId("");
  };

  return (
    <AdminCard title="Novo time" icon={Users}>
      <form onSubmit={(event) => void submit(event)} className="space-y-3">
        <TextInput label="Nome" value={name} onChange={setName} placeholder="Onovolab United" />
        <TextInput
          label="Sigla"
          value={shortName}
          onChange={setShortName}
          placeholder="ONV"
          maxLength={8}
        />
        <TextInput
          label="ID API-Football"
          value={externalId}
          onChange={setExternalId}
          placeholder="Opcional"
        />
        <SubmitButton label="Criar time" loading={createTeam.isPending} />
      </form>
    </AdminCard>
  );
}

function MatchForm() {
  const { data: teams = [] } = useTeams();
  const createMatch = useCreateMatch();
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [stage, setStage] = useState("Fase de Grupos");
  const [externalFixtureId, setExternalFixtureId] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await createMatch.mutateAsync({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      starts_at: new Date(startsAt).toISOString(),
      stage,
      external_fixture_id: externalFixtureId || null,
    });
    setExternalFixtureId("");
  };

  return (
    <AdminCard title="Novo jogo" icon={CalendarPlus}>
      <form onSubmit={(event) => void submit(event)} className="space-y-3">
        <SelectInput
          label="Mandante"
          value={homeTeamId}
          onChange={setHomeTeamId}
          options={teams.map((team) => ({ value: team.id, label: team.name }))}
        />
        <SelectInput
          label="Visitante"
          value={awayTeamId}
          onChange={setAwayTeamId}
          options={teams.map((team) => ({ value: team.id, label: team.name }))}
        />
        <TextInput
          label="Data e hora"
          type="datetime-local"
          value={startsAt}
          onChange={setStartsAt}
        />
        <TextInput label="Fase" value={stage} onChange={setStage} />
        <TextInput
          label="Fixture ID API-Football"
          value={externalFixtureId}
          onChange={setExternalFixtureId}
          placeholder="Opcional"
        />
        <SubmitButton
          label="Criar jogo"
          loading={createMatch.isPending}
          disabled={!homeTeamId || !awayTeamId || homeTeamId === awayTeamId || !startsAt}
        />
      </form>
    </AdminCard>
  );
}

function ResultForm() {
  const { data: matches = [] } = useMatches();
  const updateResult = useUpdateMatchResult();
  const [matchId, setMatchId] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const selected = useMemo(() => matches.find((match) => match.id === matchId), [matches, matchId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await updateResult.mutateAsync({
      matchId,
      payload: { home_score: Number(homeScore), away_score: Number(awayScore) },
    });
    setHomeScore("");
    setAwayScore("");
  };

  return (
    <AdminCard title="Lançar resultado" icon={Trophy}>
      <form onSubmit={(event) => void submit(event)} className="space-y-3">
        <SelectInput
          label="Jogo"
          value={matchId}
          onChange={setMatchId}
          options={matches.map((match) => ({
            value: match.id,
            label: `${formatMatchDate(match.starts_at)} ${formatMatchTime(match.starts_at)} · ${match.home_team.short_name} x ${match.away_team.short_name}`,
          }))}
        />
        {selected && (
          <p className="rounded-lg bg-background/40 p-3 text-xs text-muted-foreground">
            {selected.home_team.name} vs {selected.away_team.name}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Gols mandante"
            type="number"
            value={homeScore}
            onChange={setHomeScore}
            min={0}
          />
          <TextInput
            label="Gols visitante"
            type="number"
            value={awayScore}
            onChange={setAwayScore}
            min={0}
          />
        </div>
        <SubmitButton
          label="Publicar resultado"
          loading={updateResult.isPending}
          disabled={!matchId || homeScore === "" || awayScore === ""}
        />
      </form>
    </AdminCard>
  );
}

function AdminCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Shield;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-5">
        <Icon className="size-5 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  required?: boolean;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <input
        {...props}
        required={props.required ?? props.placeholder !== "Opcional"}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg bg-background/60 border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg bg-background/60 border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary"
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({
  label,
  loading,
  disabled,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-40 disabled:shadow-none"
    >
      {loading ? "Salvando..." : label}
    </button>
  );
}

function InlineInput({
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  name: string;
  defaultValue: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg bg-background/60 border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary"
    />
  );
}

function InlineSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-9 w-full rounded-lg bg-background/60 border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary"
    >
      {options.map((option) => (
        <option key={`${name}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function RowButton({
  label,
  loading,
  compact,
}: {
  label: string;
  loading: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`rounded-lg bg-gradient-brand px-3 py-2 text-xs font-medium text-white shadow-glow disabled:opacity-40 ${compact ? "" : "w-full"}`}
    >
      {loading ? "Salvando..." : label}
    </button>
  );
}

function teamOption(team: ApiTeam) {
  return { value: team.id, label: `${team.short_name} · ${team.name}` };
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    "auth.login": "Login Google",
    "user.company_changed": "Empresa alterada",
    "admin.user_updated": "Usuário atualizado",
    "company.created": "Empresa criada",
    "company.updated": "Empresa editada",
    "team.created": "Time criado",
    "team.updated": "Time editado",
    "match.created": "Jogo criado",
    "match.updated": "Jogo editado",
    "match.result_updated": "Resultado alterado",
    "match.score_recalculated": "Pontuação recalculada",
    "football.fixtures_synced": "Fixtures sincronizadas",
    "football.results_synced": "Resultados sincronizados",
    "whatsapp.manual_sent": "WhatsApp manual enviado",
    "whatsapp.match_reminders_sent": "Lembretes do jogo enviados",
    "whatsapp.upcoming_reminders_sent": "Lembretes próximos enviados",
    "whatsapp.scheduler_reminders_sent": "Lembretes automáticos enviados",
    "whatsapp.result_sent": "Resultado enviado no WhatsApp",
    "whatsapp.ranking_sent": "Ranking enviado no WhatsApp",
  };
  return labels[action] ?? action;
}

function auditEventSummary(event: ApiAuditEvent) {
  const metadata = event.metadata_json ?? {};
  const result = metadata.result as Record<string, unknown> | undefined;
  const sent = metadata.sent ?? result?.sent;
  const checked = result?.fixtures_checked ?? result?.matches_checked ?? metadata.matches_checked;
  const scored = metadata.predictions_scored ?? result?.predictions_scored;

  if (typeof sent === "number") return `${sent} mensagem(ns) enviada(s).`;
  if (typeof checked === "number") return `${checked} item(ns) verificado(s).`;
  if (typeof scored === "number") return `${scored} palpite(s) recalculado(s).`;
  if (event.target_id) return `Alvo ${event.target_id.slice(0, 8)}.`;
  return "Evento registrado na operação.";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
