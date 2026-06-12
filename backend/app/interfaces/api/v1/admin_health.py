from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_settings
from app.domain.entities import GameAnalysis, Match, Notification
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/health")
async def operational_health(session: AsyncSession = Depends(get_session)) -> dict:
    settings = get_settings()
    whatsapp = await _whatsapp_status()
    last_sync = await _last_api_football_sync(session)
    last_analysis = await _last_analysis(session)
    scheduler = await _scheduler_status(session)
    errors = await _recent_errors(session)

    return {
        "checked_at": datetime.now(UTC).isoformat(),
        "api": {
            "status": "online",
            "environment": settings.environment,
        },
        "whatsapp": whatsapp,
        "scheduler": scheduler,
        "api_football": last_sync,
        "openai": last_analysis,
        "errors": errors,
    }


async def _whatsapp_status() -> dict:
    settings = get_settings()
    if settings.whatsapp_provider != "baileys":
        return {
            "status": "mock",
            "connected": settings.whatsapp_provider == "mock",
            "provider": settings.whatsapp_provider,
            "detail": "WhatsApp real desativado neste ambiente.",
        }

    try:
        async with httpx.AsyncClient(base_url=settings.whatsapp_gateway_url, timeout=5) as client:
            response = await client.get("/session/status")
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        return {
            "status": "error",
            "connected": False,
            "provider": "baileys",
            "detail": str(exc),
        }

    connection = payload.get("connection", "unknown")
    return {
        "status": connection,
        "connected": connection == "connected",
        "provider": "baileys",
        "has_qr": bool(payload.get("hasQr")),
    }


async def _last_api_football_sync(session: AsyncSession) -> dict:
    statement = (
        select(Match)
        .where(Match.metadata_json["source"].as_string() == "api-football")
        .order_by(desc(Match.updated_at))
        .limit(1)
    )
    match = (await session.execute(statement)).scalar_one_or_none()
    if not match:
        return {
            "status": "not_synced",
            "last_sync_at": None,
            "detail": "Nenhum jogo sincronizado pela API-Football ainda.",
        }

    metadata = match.metadata_json or {}
    return {
        "status": "synced",
        "last_sync_at": metadata.get("synced_at") or match.updated_at.isoformat(),
        "fixture_id": match.external_fixture_id,
        "league": (metadata.get("league") or {}).get("name"),
        "round": (metadata.get("league") or {}).get("round"),
    }


async def _last_analysis(session: AsyncSession) -> dict:
    statement = select(GameAnalysis).order_by(desc(GameAnalysis.created_at)).limit(1)
    analysis = (await session.execute(statement)).scalar_one_or_none()
    if not analysis:
        return {
            "status": "not_generated",
            "last_analysis_at": None,
            "detail": "Nenhuma análise IA gerada ainda.",
        }

    return {
        "status": "generated",
        "last_analysis_at": analysis.created_at.isoformat(),
        "provider": analysis.provider,
        "model": analysis.model,
        "confidence": float(analysis.confidence),
        "match_id": str(analysis.match_id),
    }


async def _scheduler_status(session: AsyncSession) -> dict:
    settings = get_settings()
    statement = (
        select(Notification)
        .where(
            Notification.payload["type"].as_string() == "match_reminder",
            Notification.payload["source"].as_string() == "scheduler",
        )
        .order_by(desc(Notification.created_at))
        .limit(1)
    )
    notification = (await session.execute(statement)).scalar_one_or_none()
    return {
        "status": "enabled" if settings.notification_scheduler_enabled else "disabled",
        "enabled": settings.notification_scheduler_enabled,
        "interval_seconds": settings.notification_scheduler_interval_seconds,
        "window_minutes": settings.notification_reminder_window_minutes,
        "last_run_evidence_at": notification.created_at.isoformat() if notification else None,
        "last_notification_status": notification.status if notification else None,
    }


async def _recent_errors(session: AsyncSession) -> list[dict[str, Any]]:
    statement = (
        select(Notification)
        .where(Notification.status.in_(["failed", "not_connected", "error"]))
        .order_by(desc(Notification.created_at))
        .limit(8)
    )
    notifications = (await session.execute(statement)).scalars().all()
    errors: list[dict[str, Any]] = []
    for notification in notifications:
        provider_payload = (notification.payload or {}).get("provider") or {}
        errors.append(
            {
                "type": "notification",
                "status": notification.status,
                "message": provider_payload.get("error")
                or provider_payload.get("message")
                or notification.message[:140],
                "created_at": notification.created_at.isoformat(),
                "destination": notification.destination,
            }
        )
    return errors
