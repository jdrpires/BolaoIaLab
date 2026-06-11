import { useCompanies, useMe, useUpdateMyCompany } from "@/lib/api/hooks";
import { Building2 } from "lucide-react";
import { FormEvent, useState } from "react";

export function CompanyOnboarding() {
  const { data: me } = useMe();
  const { data: companies = [] } = useCompanies();
  const updateCompany = useUpdateMyCompany();
  const [companyId, setCompanyId] = useState("");

  if (!me || me.company_id) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!companyId) return;
    await updateCompany.mutateAsync({ company_id: companyId });
  };

  return (
    <div className="mb-6 glass rounded-2xl p-5 border-primary/40">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary mb-2">
            <Building2 className="size-4" /> Complete seu perfil
          </div>
          <h2 className="font-display font-bold text-xl">Escolha sua empresa</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Não encontramos uma empresa automaticamente para {me.email}. Selecione uma para entrar
            nos rankings corporativos.
          </p>
        </div>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex flex-col sm:flex-row gap-3 min-w-0 md:min-w-[420px]"
        >
          <select
            required
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            className="h-11 flex-1 rounded-lg bg-background/60 border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Selecione</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={updateCompany.isPending}
            className="rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-40"
          >
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}
