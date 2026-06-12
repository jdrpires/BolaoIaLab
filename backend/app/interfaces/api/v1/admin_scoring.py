from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.audit import record_audit_event
from app.application.scoring_rules import get_active_scoring_rule
from app.domain.entities import ScoringRule, User
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import require_admin
from app.schemas.common import ScoringRuleRead, ScoringRuleUpdate

router = APIRouter(prefix="/admin/scoring-rule", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("", response_model=ScoringRuleRead)
async def get_scoring_rule(session: AsyncSession = Depends(get_session)) -> ScoringRule:
    return await get_active_scoring_rule(session)


@router.patch("", response_model=ScoringRuleRead)
async def update_scoring_rule(
    payload: ScoringRuleUpdate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ScoringRule:
    rule = await get_active_scoring_rule(session)
    updates = payload.model_dump()
    before = {field: getattr(rule, field) for field in updates}
    for field, value in updates.items():
        setattr(rule, field, value)

    await record_audit_event(
        session,
        action="scoring.rule_updated",
        target_type="scoring_rule",
        target_id=rule.id,
        actor=actor,
        metadata={"before": before, "after": updates},
    )
    await session.commit()
    await session.refresh(rule)
    return rule
