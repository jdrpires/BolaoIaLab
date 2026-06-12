import secrets

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_settings
from app.domain.entities import Company, User
from app.infrastructure.db.session import get_session
from app.infrastructure.external.google_oauth import GoogleOAuthClient
from app.infrastructure.security.jwt import create_access_token
from app.interfaces.api.dependencies import get_current_user
from app.schemas.common import TokenRead, UserCompanyUpdate, UserPhoneUpdate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


def _safe_avatar_url(profile: dict) -> str | None:
    picture = profile.get("picture")
    if not picture:
        return None
    return str(picture)


@router.get("/google/login")
def google_login() -> dict:
    state = secrets.token_urlsafe(24)
    return {"authorization_url": GoogleOAuthClient().login_url(state), "state": state}


@router.get("/google/callback")
async def google_callback(code: str = Query(...), session: AsyncSession = Depends(get_session)) -> RedirectResponse:
    profile = await GoogleOAuthClient().exchange_code(code)
    email = profile["email"].lower()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        domain = email.split("@")[-1]
        company = (await session.execute(select(Company).where(Company.domain == domain))).scalar_one_or_none()
        user = User(
            email=email,
            full_name=profile.get("name") or email,
            avatar_url=_safe_avatar_url(profile),
            google_sub=profile.get("sub"),
            company_id=company.id if company else None,
        )
        session.add(user)
    else:
        user.full_name = profile.get("name") or user.full_name
        user.avatar_url = _safe_avatar_url(profile) or user.avatar_url
        user.google_sub = profile.get("sub") or user.google_sub

    await session.commit()
    await session.refresh(user)
    token = create_access_token(user.id, user.email)
    frontend_url = str(get_settings().frontend_app_url).rstrip("/")
    return RedirectResponse(f"{frontend_url}/auth/callback#access_token={token}")


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me/company", response_model=UserRead)
async def update_my_company(
    payload: UserCompanyUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    company = await session.get(Company, payload.company_id)
    if not company or not company.is_active:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    user.company_id = company.id
    await session.commit()
    await session.refresh(user)
    return user


@router.patch("/me/phone", response_model=UserRead)
async def update_my_phone(
    payload: UserPhoneUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    user.phone_number = _normalize_phone(payload.phone_number)
    await session.commit()
    await session.refresh(user)
    return user


def _normalize_phone(phone_number: str | None) -> str | None:
    if not phone_number:
        return None
    digits = "".join(character for character in phone_number if character.isdigit())
    return digits or None
