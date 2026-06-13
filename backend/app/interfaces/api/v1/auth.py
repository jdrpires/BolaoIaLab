import secrets

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import get_settings
from app.application.audit import record_audit_event
from app.domain.entities import Company, GameAnalysis, Match, Prediction, User
from app.infrastructure.db.session import get_session
from app.infrastructure.external.google_oauth import GoogleOAuthClient
from app.infrastructure.security.jwt import create_access_token
from app.interfaces.api.dependencies import get_current_user
from app.schemas.common import (
    TokenRead,
    UserCompanyUpdate,
    UserNotificationPreferencesUpdate,
    UserPhoneUpdate,
    UserRead,
    UserSummaryRead,
)

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


@router.get("/google/start")
def google_start() -> RedirectResponse:
    state = secrets.token_urlsafe(24)
    return RedirectResponse(GoogleOAuthClient().login_url(state))


@router.get("/google/callback")
async def google_callback(code: str = Query(...), session: AsyncSession = Depends(get_session)) -> RedirectResponse:
    profile = await GoogleOAuthClient().exchange_code(code)
    email = profile["email"].lower()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    created = user is None

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

    await session.flush()
    await record_audit_event(
        session,
        action="auth.login",
        target_type="user",
        target_id=user.id,
        actor=user,
        metadata={
            "email": user.email,
            "created": created,
            "company_id": user.company_id,
            "provider": "google",
        },
    )
    await session.commit()
    await session.refresh(user)
    token = create_access_token(user.id, user.email)
    frontend_url = str(get_settings().frontend_app_url).rstrip("/")
    return RedirectResponse(f"{frontend_url}/auth/callback#access_token={token}")


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/me/summary", response_model=UserSummaryRead)
async def me_summary(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> dict:
    ranking_rows = await _ranking_rows(session)
    rank = next((index + 1 for index, row in enumerate(ranking_rows) if row["id"] == user.id), None)
    current = next((row for row in ranking_rows if row["id"] == user.id), None)
    points = int(current["points"]) if current else 0

    predictions = await _user_predictions_with_matches(user.id, session)
    scored_predictions = [prediction for prediction in predictions if prediction.match.home_score is not None and prediction.match.away_score is not None]
    exact_hits = 0
    winner_hits = 0
    for prediction in scored_predictions:
        match = prediction.match
        if prediction.home_score == match.home_score and prediction.away_score == match.away_score:
            exact_hits += 1
        if _outcome(prediction.home_score, prediction.away_score) == _outcome(match.home_score or 0, match.away_score or 0):
            winner_hits += 1

    match_ids = [prediction.match_id for prediction in predictions]
    analyses_available = 0
    if match_ids:
        analyses_available = int(
            await session.scalar(
                select(func.count(func.distinct(GameAnalysis.match_id))).where(GameAnalysis.match_id.in_(match_ids))
            )
            or 0
        )

    return {
        "points": points,
        "rank": rank,
        "participants": len(ranking_rows),
        "predictions": len(predictions),
        "scored_predictions": len(scored_predictions),
        "exact_hits": exact_hits,
        "winner_hits": winner_hits,
        "analyses_available": analyses_available,
    }


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

    old_company_id = user.company_id
    user.company_id = company.id
    await record_audit_event(
        session,
        action="user.company_changed",
        target_type="user",
        target_id=user.id,
        actor=user,
        metadata={"old_company_id": old_company_id, "new_company_id": company.id},
    )
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


@router.patch("/me/notification-preferences", response_model=UserRead)
async def update_my_notification_preferences(
    payload: UserNotificationPreferencesUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(user, field, value)
    await session.commit()
    await session.refresh(user)
    return user


def _normalize_phone(phone_number: str | None) -> str | None:
    if not phone_number:
        return None
    digits = "".join(character for character in phone_number if character.isdigit())
    return digits or None


async def _ranking_rows(session: AsyncSession) -> list[dict]:
    statement = (
        select(
            User.id,
            func.coalesce(func.sum(Prediction.points), 0).label("points"),
        )
        .select_from(User)
        .outerjoin(Prediction, Prediction.user_id == User.id)
        .where(User.is_active.is_(True))
        .group_by(User.id, User.full_name)
        .order_by(desc("points"), User.full_name)
    )
    return [dict(row) for row in (await session.execute(statement)).mappings().all()]


async def _user_predictions_with_matches(user_id, session: AsyncSession) -> list[Prediction]:  # type: ignore[no-untyped-def]
    statement = (
        select(Prediction)
        .options(selectinload(Prediction.match))
        .where(Prediction.user_id == user_id)
        .order_by(Prediction.created_at.desc())
    )
    return list((await session.execute(statement)).scalars().all())


def _outcome(home: int, away: int) -> str:
    if home > away:
        return "home"
    if away > home:
        return "away"
    return "draw"
