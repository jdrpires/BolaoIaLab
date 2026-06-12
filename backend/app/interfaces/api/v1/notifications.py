from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.audit import record_audit_event
from app.application.notification_reminders import send_match_reminders_for_match, send_upcoming_match_reminders
from app.application.rankings import RankingService
from app.domain.entities import Match, Notification, Prediction, User
from app.infrastructure.db.session import get_session
from app.infrastructure.external.whatsapp import WhatsAppClient
from app.interfaces.api.dependencies import require_admin
from app.schemas.common import MatchNotificationPayload, NotificationCreate, NotificationRead, UpcomingReminderPayload

router = APIRouter(prefix="/notifications", tags=["notifications"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
) -> list[Notification]:
    statement = select(Notification).order_by(desc(Notification.created_at)).limit(limit)
    return list((await session.execute(statement)).scalars().all())


@router.post("/whatsapp")
async def send_whatsapp(
    payload: NotificationCreate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    notification = await _send_and_record(session, payload.user_id, payload.destination, payload.message, {"type": "manual"})
    await record_audit_event(
        session,
        action="whatsapp.manual_sent",
        target_type="notification",
        target_id=notification.id,
        actor=actor,
        metadata={"user_id": payload.user_id, "destination": payload.destination, "status": notification.status},
    )
    await session.commit()
    return {"notification_id": notification.id, "status": notification.status}


@router.post("/whatsapp/reminders")
async def send_match_reminders(
    payload: MatchNotificationPayload,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    match = await _match_or_404(payload.match_id, session)
    result = await send_match_reminders_for_match(session, match, source="admin")
    await record_audit_event(
        session,
        action="whatsapp.match_reminders_sent",
        target_type="match",
        target_id=match.id,
        actor=actor,
        metadata=result,
    )
    await session.commit()
    return result


@router.post("/whatsapp/upcoming-reminders")
async def send_upcoming_reminders(
    payload: UpcomingReminderPayload,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    result = await send_upcoming_match_reminders(session, payload.minutes_before, source="admin_upcoming")
    await record_audit_event(
        session,
        action="whatsapp.upcoming_reminders_sent",
        target_type="matches",
        actor=actor,
        metadata={"minutes_before": payload.minutes_before, "result": result},
    )
    await session.commit()
    return result


@router.post("/whatsapp/results")
async def send_match_result(
    payload: MatchNotificationPayload,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    match = await _match_or_404(payload.match_id, session)
    if match.home_score is None or match.away_score is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Match result is not available")
    users = await _users_with_phone(session, preference="results")
    sent = 0
    for user in users:
        prediction = await _prediction_for(user.id, match.id, session)
        points_text = f" Voce fez {prediction.points} pontos." if prediction else ""
        message = (
            f"Resultado Copa Tech: {match.home_team.short_name} {match.home_score} x {match.away_score} "
            f"{match.away_team.short_name}.{points_text}"
        )
        await _send_and_record(session, user.id, user.phone_number or "", message, {"type": "match_result", "match_id": str(match.id)})
        sent += 1
    result = {"sent": sent}
    await record_audit_event(
        session,
        action="whatsapp.result_sent",
        target_type="match",
        target_id=match.id,
        actor=actor,
        metadata=result,
    )
    await session.commit()
    return result


@router.post("/whatsapp/ranking")
async def send_ranking(
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    ranking = await RankingService(session).individual(limit=5)
    ranking_lines = "\n".join([f"{row['rank']}. {row['full_name']} - {row['points']} pts" for row in ranking])
    message = f"Ranking Copa Tech atualizado:\n{ranking_lines or 'Ainda sem pontuacao.'}"
    users = await _users_with_phone(session, preference="ranking")
    sent = 0
    for user in users:
        await _send_and_record(session, user.id, user.phone_number or "", message, {"type": "ranking"})
        sent += 1
    result = {"sent": sent}
    await record_audit_event(
        session,
        action="whatsapp.ranking_sent",
        target_type="ranking",
        actor=actor,
        metadata=result,
    )
    await session.commit()
    return result


async def _match_or_404(match_id: UUID, session: AsyncSession) -> Match:
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match_id)
    match = (await session.execute(statement)).scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match


async def _users_with_phone(session: AsyncSession, preference: str | None = None) -> list[User]:
    conditions = [User.is_active.is_(True), User.phone_number.is_not(None)]
    if preference == "results":
        conditions.append(User.notify_results.is_(True))
    elif preference == "ranking":
        conditions.append(User.notify_ranking.is_(True))
    statement = select(User).where(*conditions).order_by(User.full_name)
    return list((await session.execute(statement)).scalars().all())


async def _prediction_for(user_id: UUID, match_id: UUID, session: AsyncSession) -> Prediction | None:
    statement = select(Prediction).where(Prediction.user_id == user_id, Prediction.match_id == match_id)
    return (await session.execute(statement)).scalar_one_or_none()


async def _send_and_record(session: AsyncSession, user_id: UUID, destination: str, message: str, payload: dict) -> Notification:
    provider_response: dict
    status_value = "sent"
    try:
        provider_response = await WhatsAppClient().send_text(destination, message)
        status_value = provider_response.get("status", "sent")
    except Exception as exc:
        provider_response = {"provider": "baileys", "status": "failed", "error": str(exc)}
        status_value = "failed"

    notification = Notification(
        user_id=user_id,
        channel="whatsapp",
        destination=destination,
        message=message,
        status=status_value,
        provider_message_id=provider_response.get("id")
        or (provider_response.get("messages", [{}])[0].get("id") if provider_response.get("messages") else None),
        payload={**payload, "provider": provider_response},
    )
    session.add(notification)
    return notification
