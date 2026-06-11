# WhatsApp Gateway Baileys

Servico Node.js que conecta o backend FastAPI ao WhatsApp usando Baileys.

## Endpoints

- `GET /health`: health check do container.
- `GET /session/status`: estado da conexao e QR Code em `qrDataUrl`.
- `POST /messages/send`: envia mensagem.

Payload:

```json
{
  "to": "16999999999",
  "message": "Seu palpite fecha em 30 minutos."
}
```

## Observacao

Baileys usa WhatsApp Web e nao e a API oficial da Meta. Use para MVP, pilotos e ambiente controlado. Para producao enterprise, prefira Meta Cloud API.
