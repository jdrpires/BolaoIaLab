import httpx
from fastapi import HTTPException, status

from app.core import get_settings


class GoogleOAuthClient:
    authorize_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"

    def login_url(self, state: str) -> str:
        settings = get_settings()
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": str(settings.google_redirect_uri),
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
        return str(httpx.URL(self.authorize_url, params=params))

    async def exchange_code(self, code: str) -> dict:
        settings = get_settings()
        async with httpx.AsyncClient(timeout=20) as client:
            token_response = await client.post(
                self.token_url,
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": str(settings.google_redirect_uri),
                },
            )
            if token_response.status_code >= 400:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token exchange failed")
            access_token = token_response.json()["access_token"]
            user_response = await client.get(self.userinfo_url, headers={"Authorization": f"Bearer {access_token}"})
            user_response.raise_for_status()
            return user_response.json()
