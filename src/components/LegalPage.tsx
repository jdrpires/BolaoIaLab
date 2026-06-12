import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
              <Trophy className="size-5 text-white" />
            </div>
            <div>
              <div className="font-display text-sm font-bold leading-tight">Copa Tech</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Onovolab 2026
              </div>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
            <ShieldCheck className="size-4" /> {eyebrow}
          </div>
          <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          <p className="mt-3 text-xs text-muted-foreground">Última atualização: 12/06/2026.</p>
        </div>

        <article className="glass rounded-2xl p-6 md:p-8">
          <div className="space-y-8 text-sm leading-7 text-muted-foreground">{children}</div>
        </article>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
