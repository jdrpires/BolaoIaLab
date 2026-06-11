# Deploy em VPS

Este deploy sobe a aplicação completa com Docker Compose:

- `proxy`: Nginx na porta 80
- `frontend`: TanStack/Vite em produção
- `api`: FastAPI
- `postgres`: PostgreSQL
- `redis`: Redis
- `whatsapp-gateway`: Baileys

## 1. Preparar repositório

No Mac:

```bash
cd /Users/jeanpires/Projetos/BolaoIALab
git init
git add .
git commit -m "Initial production deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/bolao-ialab.git
git push -u origin main
```

## 2. Preparar VPS

Na VPS, instale Docker e o plugin Compose. Em Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Saia e entre novamente no SSH depois do `usermod`.

## 3. Clonar e configurar

```bash
git clone https://github.com/SEU_USUARIO/bolao-ialab.git
cd bolao-ialab
cp .env.staging.example .env.staging
nano .env.staging
```

Campos obrigatórios:

```env
POSTGRES_PASSWORD=uma_senha_forte
JWT_SECRET_KEY=uma_chave_longa_e_forte
FRONTEND_APP_URL=https://seudominio.com.br
GOOGLE_REDIRECT_URI=https://seudominio.com.br/api/v1/auth/google/callback
CORS_ORIGINS=["https://seudominio.com.br"]
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=...
API_FOOTBALL_KEY=...
VITE_API_BASE_URL=/api/v1
```

No Google Cloud Console, configure:

- Authorized JavaScript origins: `https://seudominio.com.br`
- Authorized redirect URIs: `https://seudominio.com.br/api/v1/auth/google/callback`

## 4. Subir aplicação

```bash
APP_ENV_FILE=.env.staging docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
```

Verificar:

```bash
docker compose -f docker-compose.staging.yml ps
curl http://localhost/api/v1/matches
curl http://localhost/health
```

Observação: a API fica disponível externamente por `/api/v1/...`, via Nginx.

## 5. WhatsApp Baileys

Ver status/QR Code:

```bash
curl http://localhost/whatsapp/session/status
```

Se estiver usando domínio:

```bash
curl https://seudominio.com.br/whatsapp/session/status
```

Copie o `qrDataUrl` e abra em um navegador para escanear com o WhatsApp.

## 6. Atualizar deploy

```bash
git pull
APP_ENV_FILE=.env.staging docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
```

## 7. Logs úteis

```bash
docker compose -f docker-compose.staging.yml logs -f proxy
docker compose -f docker-compose.staging.yml logs -f api
docker compose -f docker-compose.staging.yml logs -f frontend
docker compose -f docker-compose.staging.yml logs -f whatsapp-gateway
```
