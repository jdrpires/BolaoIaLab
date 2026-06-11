import httpx

from app.core import get_settings


class WhatsAppClient:
    async def send_text(self, phone_number: str, message: str) -> dict:
        settings = get_settings()
        if settings.whatsapp_provider == "mock":
            return {"provider": "mock", "status": "queued", "to": phone_number}

        if settings.whatsapp_provider == "baileys":
            async with httpx.AsyncClient(base_url=settings.whatsapp_gateway_url, timeout=20) as client:
                response = await client.post("/messages/send", json={"to": phone_number, "message": message})
                response.raise_for_status()
                return response.json()

        if not settings.whatsapp_access_token:
            return {"provider": "meta", "status": "not_configured", "to": phone_number}

        url = f"https://graph.facebook.com/v20.0/{settings.whatsapp_phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "text",
            "text": {"preview_url": False, "body": message},
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, json=payload, headers={"Authorization": f"Bearer {settings.whatsapp_access_token}"})
            response.raise_for_status()
            return response.json()
