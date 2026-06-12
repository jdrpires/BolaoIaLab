from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities import AuditEvent
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import require_admin
from app.schemas.common import AuditEventRead

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/audit-events", response_model=list[AuditEventRead])
async def list_audit_events(
    limit: int = Query(default=80, ge=1, le=300),
    action: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> list[AuditEvent]:
    statement = select(AuditEvent).options(selectinload(AuditEvent.actor)).order_by(desc(AuditEvent.created_at)).limit(limit)
    if action:
        statement = statement.where(AuditEvent.action == action)
    return list((await session.execute(statement)).scalars().all())
