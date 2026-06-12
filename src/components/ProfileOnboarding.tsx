import { useMe, useUpdateMyPhone } from "@/lib/api/hooks";
import { Bell, Check, MessageCircle } from "lucide-react";
import { FormEvent, useState } from "react";

export function ProfileOnboarding() {
  const { data: me } = useMe();
  const updatePhone = useUpdateMyPhone();
  const [phone, setPhone] = useState(me?.phone_number ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!me || me.phone_number) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (!digits) return;
    try {
      await updatePhone.mutateAsync({ phone_number: digits });
      setSaved(true);
    } catch {
      setError("Não foi possível salvar agora. Tente novamente em alguns segundos.");
    }
  };

  return (
    <div className="mb-6 glass rounded-2xl p-5 border-success/30">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-success mb-2">
            <MessageCircle className="size-4" /> Lembretes no WhatsApp
          </div>
          <h2 className="font-display font-bold text-xl">Receba avisos antes dos jogos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre seu WhatsApp para receber lembretes quando faltar palpite, resultados e ranking.
          </p>
        </div>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex flex-col sm:flex-row gap-3 min-w-0 md:min-w-[430px]"
        >
          <input
            value={phone}
            onChange={(event) => {
              setSaved(false);
              setError("");
              setPhone(event.target.value);
            }}
            inputMode="tel"
            placeholder="5516999999999"
            className="h-11 flex-1 rounded-lg bg-background/60 border border-border px-3 text-sm text-foreground focus:outline-none focus:border-success"
          />
          <button
            type="submit"
            disabled={updatePhone.isPending || !phone.replace(/\D/g, "")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-success/20 px-5 py-2.5 text-sm font-medium text-success disabled:opacity-40"
          >
            {saved ? <Check className="size-4" /> : <Bell className="size-4" />}
            {saved ? "Salvo" : "Ativar"}
          </button>
          {error && <div className="sm:col-span-2 text-xs text-destructive">{error}</div>}
        </form>
      </div>
    </div>
  );
}
