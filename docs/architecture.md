# Arquitetura Tecnica

## Visao geral

O projeto foi estruturado como um produto SaaS para bolao corporativo:

- Frontend existente em React/TanStack.
- Backend FastAPI em `backend/`.
- PostgreSQL como banco transacional.
- Redis preparado para cache, filas e rate limits.
- OpenAPI nativo em `/docs` e `/api/v1/openapi.json`.

## Bounded contexts

- Identidade: login Google, usuarios, roles e associacao por empresa.
- Empresas: cadastro, dominio corporativo e ranking agregado.
- Competicao: times, jogos, resultados e status.
- Palpites: previsoes por usuario, janela de fechamento e pontuacao.
- Inteligencia: analise de jogos com OpenAI e dados API-Football.
- Comunicacao: notificacoes WhatsApp via gateway Baileys no MVP e Meta Cloud API em producao.

## Endpoints principais

- `GET /api/v1/auth/google/login`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/me`
- `GET|POST /api/v1/companies`
- `GET|POST /api/v1/teams`
- `GET|POST /api/v1/matches`
- `PATCH /api/v1/matches/{match_id}/result`
- `GET /api/v1/predictions/mine`
- `PUT /api/v1/predictions`
- `GET /api/v1/rankings/individual`
- `GET /api/v1/rankings/companies`
- `POST /api/v1/analysis/matches/{match_id}`
- `POST /api/v1/notifications/whatsapp`

## Escalabilidade

Recomendacoes para producao:

- Rodar API stateless com multiplas replicas atras de load balancer.
- Usar Postgres gerenciado com backups, PITR e replicas de leitura.
- Mover envio WhatsApp e sincronizacao API-Football para workers assíncronos.
- Para ambiente enterprise, migrar WhatsApp de Baileys para Meta Cloud API oficial mantendo a interface atual.
- Adicionar Redis para cache de rankings, locks distribuidos e rate limiting.
- Instrumentar logs estruturados, traces OpenTelemetry e metricas Prometheus.
- Versionar contratos via `/api/v1` e manter migracoes Alembic revisadas em PR.
