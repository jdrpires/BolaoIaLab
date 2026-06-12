import asyncio
import logging

from app.application.audit import record_audit_event
from app.application.notification_reminders import send_upcoming_match_reminders
from app.core import get_settings
from app.infrastructure.db.session import AsyncSessionLocal
from app.infrastructure.observability import configure_logging

logger = logging.getLogger("app.notification_scheduler")


async def run_once() -> dict:
    settings = get_settings()
    async with AsyncSessionLocal() as session:
        result = await send_upcoming_match_reminders(
            session,
            minutes_before=settings.notification_reminder_window_minutes,
            source="scheduler",
        )
        if int(result.get("matches_checked", 0)) > 0 or int(result.get("sent", 0)) > 0:
            await record_audit_event(
                session,
                action="whatsapp.scheduler_reminders_sent",
                target_type="matches",
                metadata={
                    "minutes_before": settings.notification_reminder_window_minutes,
                    "result": result,
                },
            )
        await session.commit()
        logger.info("notification_scheduler_cycle_completed", extra=result)
        return result


async def run_forever() -> None:
    settings = get_settings()
    configure_logging()
    logger.info(
        "notification_scheduler_started",
        extra={
            "enabled": settings.notification_scheduler_enabled,
            "interval_seconds": settings.notification_scheduler_interval_seconds,
            "window_minutes": settings.notification_reminder_window_minutes,
        },
    )

    while True:
        if settings.notification_scheduler_enabled:
            try:
                await run_once()
            except Exception:
                logger.exception("notification_scheduler_cycle_failed")

        await asyncio.sleep(settings.notification_scheduler_interval_seconds)


def main() -> None:
    asyncio.run(run_forever())


if __name__ == "__main__":
    main()
