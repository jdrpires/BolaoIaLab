from datetime import UTC, datetime, timedelta
from uuid import UUID

from jose import jwt

from app.core import get_settings


def create_access_token(user_id: UUID, email: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    claims = {"sub": str(user_id), "email": email, "exp": expires_at}
    return jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
