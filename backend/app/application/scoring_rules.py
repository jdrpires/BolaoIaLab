from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.scoring import ScoringRules
from app.domain.entities import ScoringRule


async def get_active_scoring_rule(session: AsyncSession) -> ScoringRule:
    statement = select(ScoringRule).where(ScoringRule.is_active.is_(True)).order_by(ScoringRule.created_at.desc()).limit(1)
    rule = (await session.execute(statement)).scalar_one_or_none()
    if rule:
        return rule

    rule = ScoringRule(name="default", is_active=True)
    session.add(rule)
    await session.flush()
    return rule


def to_scoring_rules(rule: ScoringRule) -> ScoringRules:
    return ScoringRules(
        exact_score_points=rule.exact_score_points,
        winner_points=rule.winner_points,
        draw_points=rule.draw_points,
        goal_difference_points=rule.goal_difference_points,
        team_score_points=rule.team_score_points,
        underdog_bonus_points=rule.underdog_bonus_points,
    )
