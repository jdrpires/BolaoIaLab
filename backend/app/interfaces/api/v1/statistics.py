from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import and_, desc, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Company, GameAnalysis, Match, Prediction, User
from app.infrastructure.db.session import get_session
from app.schemas.common import CompanyDistribution, DailyActivity, PopularScore, PredictionsByMatch, StatisticsKpis, StatisticsOverview

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("/overview", response_model=StatisticsOverview)
async def overview(session: AsyncSession = Depends(get_session)) -> StatisticsOverview:
    participants = await session.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
    companies = await session.scalar(select(func.count(Company.id)).where(Company.is_active.is_(True))) or 0
    matches = await session.scalar(select(func.count(Match.id))) or 0
    predictions = await session.scalar(select(func.count(Prediction.id))) or 0
    analyses = await session.scalar(select(func.count(GameAnalysis.id))) or 0

    scored = await session.scalar(select(func.count(Prediction.id)).where(Prediction.scored_at.is_not(None))) or 0
    exact_hits = await session.scalar(
        select(func.count(Prediction.id))
        .join(Match, Match.id == Prediction.match_id)
        .where(
            Prediction.scored_at.is_not(None),
            Prediction.home_score == Match.home_score,
            Prediction.away_score == Match.away_score,
        )
    ) or 0
    accuracy = round((exact_hits / scored) * 100, 2) if scored else 0

    predictions_by_match_rows = (
        await session.execute(
            select(
                Match.id.label("match_id"),
                Match.starts_at,
                func.count(Prediction.id).label("predictions"),
            )
            .select_from(Match)
            .outerjoin(Prediction, Prediction.match_id == Match.id)
            .group_by(Match.id, Match.starts_at)
            .order_by(Match.starts_at)
        )
    ).mappings().all()

    match_labels = await _match_labels(session)
    predictions_by_match = [
        PredictionsByMatch(
            match_id=row["match_id"],
            label=match_labels.get(row["match_id"], "Jogo"),
            starts_at=row["starts_at"],
            predictions=int(row["predictions"] or 0),
        )
        for row in predictions_by_match_rows
    ]

    popular_rows = (
        await session.execute(
            select(
                func.concat(Prediction.home_score, " x ", Prediction.away_score).label("score"),
                func.count(Prediction.id).label("count"),
            )
            .group_by("score")
            .order_by(desc("count"))
            .limit(10)
        )
    ).mappings().all()
    popular_scores = [PopularScore(score=row["score"], count=int(row["count"])) for row in popular_rows]

    daily_activity = await _daily_activity(session)

    distribution_rows = (
        await session.execute(
            select(
                Company.id,
                Company.name,
                Company.color,
                func.count(distinct(User.id)).label("participants"),
            )
            .select_from(Company)
            .outerjoin(User, and_(User.company_id == Company.id, User.is_active.is_(True)))
            .where(Company.is_active.is_(True))
            .group_by(Company.id)
            .order_by(Company.name)
        )
    ).mappings().all()
    company_distribution = [
        CompanyDistribution(id=row["id"], name=row["name"], color=row["color"], participants=int(row["participants"] or 0))
        for row in distribution_rows
    ]

    return StatisticsOverview(
        kpis=StatisticsKpis(
            participants=int(participants),
            companies=int(companies),
            matches=int(matches),
            predictions=int(predictions),
            analyses=int(analyses),
            accuracy=accuracy,
        ),
        predictions_by_match=predictions_by_match,
        popular_scores=popular_scores,
        daily_activity=daily_activity,
        company_distribution=company_distribution,
    )


async def _match_labels(session: AsyncSession) -> dict:
    from app.domain.entities import Team

    rows = (
        await session.execute(
            select(Match.id, Team.short_name.label("home_short"))
            .join(Team, Team.id == Match.home_team_id)
        )
    ).mappings().all()
    home = {row["id"]: row["home_short"] for row in rows}

    rows = (
        await session.execute(
            select(Match.id, Team.short_name.label("away_short"))
            .join(Team, Team.id == Match.away_team_id)
        )
    ).mappings().all()
    away = {row["id"]: row["away_short"] for row in rows}
    return {match_id: f"{home.get(match_id, '?')} x {away.get(match_id, '?')}" for match_id in set(home) | set(away)}


async def _daily_activity(session: AsyncSession) -> list[DailyActivity]:
    start = datetime.now(UTC).date() - timedelta(days=6)
    days = [start + timedelta(days=i) for i in range(7)]

    prediction_rows = (
        await session.execute(
            select(func.date(Prediction.created_at).label("day"), func.count(Prediction.id).label("count"))
            .where(Prediction.created_at >= datetime.combine(start, datetime.min.time(), tzinfo=UTC))
            .group_by("day")
        )
    ).mappings().all()
    analysis_rows = (
        await session.execute(
            select(func.date(GameAnalysis.created_at).label("day"), func.count(GameAnalysis.id).label("count"))
            .where(GameAnalysis.created_at >= datetime.combine(start, datetime.min.time(), tzinfo=UTC))
            .group_by("day")
        )
    ).mappings().all()
    prediction_map = {row["day"]: int(row["count"]) for row in prediction_rows}
    analysis_map = {row["day"]: int(row["count"]) for row in analysis_rows}

    return [
        DailyActivity(
            day=day.strftime("%d/%m"),
            predictions=prediction_map.get(day, 0),
            analyses=analysis_map.get(day, 0),
        )
        for day in days
    ]
