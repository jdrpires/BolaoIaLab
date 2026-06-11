import { createFileRoute, Link } from "@tanstack/react-router";
import { startGoogleLogin } from "@/lib/api/client";
import {
  Sparkles,
  Brain,
  Trophy,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Copa Tech Onovolab 2026 — Bolão corporativo com IA" },
      {
        name: "description",
        content:
          "O bolão corporativo do ecossistema Onovolab. Palpites, ranking entre empresas e análises de IA em tempo real.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const login = () => {
    void startGoogleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <Trophy className="size-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-sm leading-tight">Copa Tech</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Onovolab 2026
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition">
              Como funciona
            </a>
            <a href="#ia" className="hover:text-foreground transition">
              IA
            </a>
            <a href="#recursos" className="hover:text-foreground transition">
              Recursos
            </a>
          </nav>
          <Link
            to="/dashboard"
            className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-glow hover:opacity-90 transition"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs mb-8">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-muted-foreground">Inscrições abertas · Edição 2026</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] max-w-5xl mx-auto">
          O bolão corporativo do <span className="text-gradient">ecossistema Onovolab</span>, com
          Inteligência Artificial.
        </h1>
        <p className="mt-7 text-lg text-muted-foreground max-w-2xl mx-auto">
          Palpites, ranking entre empresas e análises preditivas em tempo real. Conecte sua equipe,
          dispute pontos e descubra quem manda no escritório.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={login}
            className="inline-flex items-center gap-3 rounded-xl bg-white text-gray-900 px-5 py-3 font-medium shadow-card hover:scale-[1.02] transition"
          >
            <GoogleIcon /> Entrar com Google
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl glass px-5 py-3 font-medium hover:bg-white/10 transition"
          >
            Ver demonstração <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Floating stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: "Participantes", value: "119" },
            { label: "Empresas", value: "8" },
            { label: "Palpites", value: "4.886" },
            { label: "Análises de IA", value: "2.103" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 text-left">
              <div className="text-3xl font-display font-bold text-gradient">{s.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Como funciona</div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Em 3 passos sua empresa já está jogando
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              n: "01",
              t: "Entre com Google",
              d: "Login em 1 clique. Identificamos automaticamente sua empresa no ecossistema.",
            },
            {
              n: "02",
              t: "Faça seus palpites",
              d: "Marque os placares dos jogos. Consulte a IA para insights estratégicos.",
            },
            {
              n: "03",
              t: "Suba no ranking",
              d: "Some pontos pelos acertos. Sua empresa compete com todas as outras.",
            },
          ].map((s) => (
            <div key={s.n} className="glass rounded-2xl p-7 hover:border-primary/40 transition">
              <div className="text-5xl font-display font-bold text-gradient mb-4">{s.n}</div>
              <h3 className="text-xl font-semibold mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IA Highlight */}
      <section id="ia" className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass rounded-3xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-xs text-primary mb-5">
                <Sparkles className="size-3.5" /> Powered by AI
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Pergunte para a IA antes de cada palpite
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Nosso modelo analisa forma recente, estatísticas históricas, confrontos diretos e
                contexto da partida — entregando sugestão de placar com nível de confiança.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Sugestão de placar com confiança em %",
                  "Forma recente e histórico de confrontos",
                  "Indicadores ofensivos e defensivos",
                  "Cenários alternativos prováveis",
                ].map((i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="size-4 text-success shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="glass rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-8 rounded-lg bg-gradient-brand grid place-items-center">
                    <Brain className="size-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Análise IA</div>
                    <div className="text-[11px] text-muted-foreground">
                      Onovolab United vs AI Hub Stars
                    </div>
                  </div>
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-success">
                    87% confiança
                  </span>
                </div>
                <div className="rounded-xl bg-background/60 p-5 text-center mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                    Placar sugerido
                  </div>
                  <div className="text-4xl font-display font-bold">
                    2 <span className="text-muted-foreground mx-2">×</span> 1
                  </div>
                </div>
                <div className="space-y-2.5 text-xs">
                  <Row label="Forma recente" h="VVVED" a="EVDVV" />
                  <Row label="Posse média" h="58%" a="49%" />
                  <Row label="xG por jogo" h="1.8" a="1.3" />
                  <Row label="Histórico" h="4V" a="1V · 2E" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3">Recursos</div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Tudo o que sua empresa precisa para jogar
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              i: Trophy,
              t: "Ranking individual e por empresa",
              d: "Veja sua posição em tempo real e a evolução semanal.",
            },
            {
              i: BarChart3,
              t: "Estatísticas avançadas",
              d: "Placares populares, taxa de acerto e gráficos modernos.",
            },
            {
              i: Users,
              t: "Multi-empresa",
              d: "Compita com todas as empresas do ecossistema Onovolab.",
            },
            {
              i: Zap,
              t: "Tempo real",
              d: "Resultados, posições e pontuação atualizados instantaneamente.",
            },
            {
              i: Brain,
              t: "IA preditiva",
              d: "Sugestões de placar com base em dados históricos e contexto.",
            },
            {
              i: Sparkles,
              t: "Visual premium",
              d: "Interface moderna pronta para apresentar a executivos.",
            },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="glass rounded-2xl p-6 hover:border-primary/40 transition">
              <div className="size-11 rounded-xl bg-gradient-brand grid place-items-center mb-4 shadow-glow">
                <Icon className="size-5 text-white" />
              </div>
              <h3 className="font-semibold mb-1.5">{t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="glass rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-brand opacity-10" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold">Pronto para começar?</h2>
            <p className="mt-4 text-muted-foreground">
              Entre com sua conta Google corporativa e represente sua empresa na Copa Tech 2026.
            </p>
            <button
              onClick={login}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white text-gray-900 px-6 py-3 font-medium shadow-card"
            >
              <GoogleIcon /> Entrar com Google
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 Copa Tech · Onovolab · AI Hub · Code Synergy
      </footer>
    </div>
  );
}

function Row({ label, h, a }: { label: string; h: string; a: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center py-1.5 border-b border-border/40 last:border-0">
      <span className="font-medium text-right">{h}</span>
      <span className="text-center text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <span className="font-medium text-left">{a}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
