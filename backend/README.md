# Bolao IA Lab API

Backend FastAPI com Clean Architecture pragmatica, DDD e OpenAPI.

## Subir local

```bash
cp .env.example .env
docker compose up --build
```

API: `http://localhost:8000`  
Swagger/OpenAPI: `http://localhost:8000/docs`  
Health check: `http://localhost:8000/health`

## Camadas

- `domain`: entidades, enums e invariantes persistentes.
- `application`: casos de uso e regras de negocio, como pontuacao e rankings.
- `infrastructure`: banco, seguranca e adaptadores externos.
- `interfaces`: routers HTTP, dependencias FastAPI e DTOs.

## Autenticacao

O fluxo principal usa Google OAuth:

1. `GET /api/v1/auth/google/login` retorna a URL de autorizacao.
2. Google redireciona para `/api/v1/auth/google/callback?code=...`.
3. A API cria ou atualiza o usuario e retorna um JWT bearer.
4. Endpoints privados usam `Authorization: Bearer <token>`.

## Pontuacao

Regra inicial:

- 10 pontos para placar exato.
- 6 pontos para resultado e saldo corretos.
- 4 pontos para vencedor/empate correto.
- 1 ponto por gol exato de cada time quando nao houve placar exato.

## Integracoes

- OpenAI: `POST /api/v1/analysis/matches/{match_id}` gera analise e sugestao de placar.
- API-Football: `POST /api/v1/matches/sync-fixtures` sincroniza times/jogos/resultados e `POST /api/v1/matches/sync-results` atualiza resultados dos jogos vinculados.
- WhatsApp: `POST /api/v1/notifications/whatsapp` envia mensagens via gateway Baileys, Meta Cloud API ou mock local.

Para API-Football, configure:

```env
API_FOOTBALL_KEY=sua_chave
API_FOOTBALL_DEFAULT_LEAGUE=71
API_FOOTBALL_DEFAULT_SEASON=2026
```

Os valores de liga e temporada tambem podem ser informados diretamente no painel admin.

## WhatsApp com Baileys

O `docker compose` sobe um servico Node.js chamado `whatsapp-gateway`.

1. Suba os containers:

```bash
docker compose up --build
```

2. Abra o status da sessao:

```text
http://localhost:3001/session/status
```

3. Escaneie o QR Code retornado em `qrDataUrl` com o WhatsApp do numero que enviara as mensagens.

4. Quando `connection` for `connected`, a API podera enviar pelo endpoint:

```text
POST /api/v1/notifications/whatsapp
```

A sessao fica persistida no volume Docker `baileys_auth`.

## Migracoes

```bash
cd backend
alembic upgrade head
python -m app.infrastructure.db.seed
```
