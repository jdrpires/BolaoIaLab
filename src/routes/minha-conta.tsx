import { createFileRoute } from "@tanstack/react-router";
import { Bell, Building2, Check, LogOut, MessageCircle, UserCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AuthGate } from "@/components/AuthGate";
import { clearAccessToken } from "@/lib/api/client";
import {
  useCompanies,
  useMe,
  useUpdateMyCompany,
  useUpdateMyNotificationPreferences,
  useUpdateMyPhone,
} from "@/lib/api/hooks";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({ meta: [{ title: "Minha Conta · Copa Tech" }] }),
  component: MinhaConta,
});

function MinhaConta() {
  const { data: me } = useMe();
  const { data: companies = [] } = useCompanies();
  const updateCompany = useUpdateMyCompany();
  const updatePhone = useUpdateMyPhone();
  const updatePreferences = useUpdateMyNotificationPreferences();
  const [companyId, setCompanyId] = useState("");
  const [phone, setPhone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCompanyId(me?.company_id ?? "");
    setPhone(me?.phone_number ?? "");
  }, [me?.company_id, me?.phone_number]);

  const submitCompany = async (event: FormEvent) => {
    event.preventDefault();
    if (!companyId) return;
    setError("");
    await updateCompany.mutateAsync({ company_id: companyId });
    setFeedback("Empresa atualizada.");
  };

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    try {
      await updatePhone.mutateAsync({ phone_number: digits || null });
      setFeedback(digits ? "WhatsApp atualizado." : "WhatsApp removido.");
    } catch {
      setError("Não foi possível salvar o WhatsApp agora.");
    }
  };

  const togglePreference = async (
    key: "notify_match_reminders" | "notify_results" | "notify_ranking",
    value: boolean,
  ) => {
    setError("");
    await updatePreferences.mutateAsync({ [key]: value });
    setFeedback("Preferências atualizadas.");
  };

  const logout = () => {
    clearAccessToken();
    window.location.href = "/";
  };

  return (
    <AppLayout>
      <AuthGate>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
              <UserCircle className="size-4" /> Perfil
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">Minha Conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Atualize seus dados de participação e controle como quer receber os avisos do bolão.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" /> Sair da conta
          </button>
        </div>

        {(feedback || error) && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              error ? "border-destructive/30 text-destructive" : "border-success/30 text-success"
            }`}
          >
            {error || feedback}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass rounded-2xl p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                <Building2 className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Empresa</h2>
                <p className="text-sm text-muted-foreground">Define seu ranking corporativo.</p>
              </div>
            </div>
            <form onSubmit={(event) => void submitCompany(event)} className="space-y-4">
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Selecione uma empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!companyId || updateCompany.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-40"
              >
                <Check className="size-4" /> Salvar empresa
              </button>
            </form>
          </section>

          <section className="glass rounded-2xl p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-success/15 text-success">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">WhatsApp</h2>
                <p className="text-sm text-muted-foreground">Use DDI + DDD + número.</p>
              </div>
            </div>
            <form onSubmit={(event) => void submitPhone(event)} className="space-y-4">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                placeholder="5516999999999"
                className="h-11 w-full rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground focus:border-success focus:outline-none"
              />
              <button
                type="submit"
                disabled={updatePhone.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-success/20 px-5 py-2.5 text-sm font-medium text-success disabled:opacity-40"
              >
                <Check className="size-4" /> Salvar WhatsApp
              </button>
            </form>
          </section>

          <section className="glass rounded-2xl p-5 lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-warning/15 text-warning">
                <Bell className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Preferências de notificação</h2>
                <p className="text-sm text-muted-foreground">
                  Escolha quais mensagens automáticas quer receber.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <PreferenceToggle
                title="Lembrete de palpite"
                description="Aviso antes dos jogos quando seu palpite ainda estiver pendente."
                checked={me?.notify_match_reminders ?? true}
                disabled={updatePreferences.isPending}
                onChange={(value) => void togglePreference("notify_match_reminders", value)}
              />
              <PreferenceToggle
                title="Resultado do jogo"
                description="Mensagem com resultado e seus pontos depois da partida."
                checked={me?.notify_results ?? true}
                disabled={updatePreferences.isPending}
                onChange={(value) => void togglePreference("notify_results", value)}
              />
              <PreferenceToggle
                title="Ranking"
                description="Atualizações com o top do ranking geral."
                checked={me?.notify_ranking ?? true}
                disabled={updatePreferences.isPending}
                onChange={(value) => void togglePreference("notify_ranking", value)}
              />
            </div>
          </section>
        </div>
      </AuthGate>
    </AppLayout>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-[132px] cursor-pointer flex-col justify-between rounded-xl border border-border bg-background/45 p-4">
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <span className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
        {checked ? "Ativo" : "Desativado"}
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="size-5 accent-primary"
        />
      </span>
    </label>
  );
}
