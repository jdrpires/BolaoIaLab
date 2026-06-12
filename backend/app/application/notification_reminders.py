from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import get_settings
from app.domain.entities import Match, MatchStatus, Notification, Prediction, User
from app.infrastructure.external.whatsapp import WhatsAppClient


async def send_match_reminders_for_match(session: AsyncSession, match: Match, source: str = "manual") -> dict:
    users = await _users_with_phone(session)
    sent = 0
    skipped_with_prediction = 0
    skipped_already_sent = 0

    for user in users:
        if await _has_prediction(user.id, match.id, session):
            skipped_with_prediction += 1
            continue

        if await _has_reminder_sent(user.id, match.id, session):
            skipped_already_sent += 1
            continue

        await _send_and_record(
            session,
            user,
            match,
            _reminder_message(user, match),
            {"type": "match_reminder", "match_id": str(match.id), "source": source},
        )
        sent += 1

    return {
        "sent": sent,
        "skipped_with_prediction": skipped_with_prediction,
        "skipped_already_sent": skipped_already_sent,
    }


async def send_upcoming_match_reminders(session: AsyncSession, minutes_before: int, source: str = "scheduler") -> dict:
    now = datetime.now(UTC)
    until = now + timedelta(minutes=minutes_before)
    statement = (
        select(Match)
        .options(selectinload(Match.home_team), selectinload(Match.away_team))
        .where(Match.starts_at > now, Match.starts_at <= until, Match.status == MatchStatus.SCHEDULED)
        .order_by(Match.starts_at)
    )
    matches = list((await session.execute(statement)).scalars().all())

    totals = {
        "matches_checked": len(matches),
        "sent": 0,
        "skipped_with_prediction": 0,
        "skipped_already_sent": 0,
    }
    for match in matches:
        result = await send_match_reminders_for_match(session, match, source=source)
        totals["sent"] += int(result["sent"])
        totals["skipped_with_prediction"] += int(result["skipped_with_prediction"])
        totals["skipped_already_sent"] += int(result["skipped_already_sent"])

    return totals


async def _users_with_phone(session: AsyncSession) -> list[User]:
    statement = select(User).where(User.is_active.is_(True), User.phone_number.is_not(None)).order_by(User.full_name)
    return list((await session.execute(statement)).scalars().all())


async def _has_prediction(user_id, match_id, session: AsyncSession) -> bool:  # type: ignore[no-untyped-def]
    statement = select(Prediction.id).where(Prediction.user_id == user_id, Prediction.match_id == match_id).limit(1)
    return (await session.execute(statement)).scalar_one_or_none() is not None


async def _has_reminder_sent(user_id, match_id, session: AsyncSession) -> bool:  # type: ignore[no-untyped-def]
    statement = (
        select(Notification.id)
        .where(
            Notification.user_id == user_id,
            Notification.channel == "whatsapp",
            Notification.payload["type"].as_string() == "match_reminder",
            Notification.payload["match_id"].as_string() == str(match_id),
        )
        .limit(1)
    )
    return (await session.execute(statement)).scalar_one_or_none() is not None


def _reminder_message(user: User, match: Match) -> str:
    settings = get_settings()
    first_name = user.full_name.split()[0] if user.full_name else "participante"
    starts_at_br = match.starts_at.astimezone(ZoneInfo("America/Sao_Paulo"))
    return (
        f"Oi, {first_name}! Seu palpite para "
        f"{match.home_team.short_name} x {match.away_team.short_name} ainda está pendente. "
        f"O jogo começa em {starts_at_br.strftime('%d/%m às %H:%M')} no horário de Brasília. "
        f"Acesse {settings.frontend_app_url}/palpites e participe."
    )


async def _send_and_record(session: AsyncSession, user: User, match: Match, message: str, payload: dict) -> Notification:
    provider_response: dict
    status_value = "sent"
    try:
        provider_response = await WhatsAppClient().send_text(user.phone_number or "", message)
        status_value = provider_response.get("status", "sent")
    except Exception as exc:
        provider_response = {"provider": "baileys", "status": "failed", "error": str(exc)}
        status_value = "failed"

    notification = Notification(
        user_id=user.id,
        channel="whatsapp",
        destination=user.phone_number or "",
        message=message,
        status=status_value,
        provider_message_id=provider_response.get("id")
        or (provider_response.get("messages", [{}])[0].get("id") if provider_response.get("messages") else None),
        payload={**payload, "provider": provider_response},
    )
    session.add(notification)
    return notification
