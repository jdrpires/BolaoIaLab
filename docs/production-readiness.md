# Qualidade para producao

## Checks locais

Backend:

```bash
pytest
python3 -m compileall backend/app
```

Frontend:

```bash
npm run test:frontend
```

## Logs e erros

- A API emite logs JSON por request com `request_id`, metodo, rota, status, duracao e IP.
- Toda resposta de erro segue o envelope `{"error": {"code", "message", "request_id"}}`.
- Envie `x-request-id` pelo proxy/load balancer para correlacionar chamadas ponta a ponta.

## Rate limit

Variaveis:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=120
RATE_LIMIT_WINDOW_SECONDS=60
```

O limitador atual e em memoria por instancia. Para multiplas replicas, evoluir para Redis compartilhado antes de escalar horizontalmente.

## Staging

Crie `.env.staging` a partir de `.env.example` e preencha segredos reais.

```bash
docker compose -f docker-compose.staging.yml up -d --build
docker compose -f docker-compose.staging.yml ps
curl http://localhost:8000/health
```

## CI/CD

O workflow `.github/workflows/ci.yml` roda:

- Testes Python.
- Compilacao Python.
- Typecheck, lint e build do frontend.
- Build das imagens Docker da API e do WhatsApp gateway.

O deploy staging e disparado pela branch `main` quando os secrets SSH estiverem configurados.
