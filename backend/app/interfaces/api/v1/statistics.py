from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, desc, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.rankings import RankingService
from app.domain.entities import Company, GameAnalysis, Match, MatchStatus, Prediction, User
from app.infrastructure.db.session import get_session
from app.schemas.common import (
    CompanyDistribution,
    DailyActivity,
    PopularScore,
    PredictionsByMatch,
    RoundFeed,
    RoundFeedHighlight,
    RoundRankingItem,
    StatisticsKpis,
    StatisticsOverview,
)

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


@router.get("/round-feed", response_model=RoundFeed)
async def round_feed(
    stage: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> RoundFeed:
    selected_stage = stage or await _current_stage(session)
    if not selected_stage:
        return RoundFeed(stage=None, matches=0, predictions=0, participants=0, highlights=[], ranking=[])

    matches = await session.scalar(select(func.count(Match.id)).where(Match.stage == selected_stage)) or 0
    predictions = await session.scalar(
        select(func.count(Prediction.id)).join(Match, Match.id == Prediction.match_id).where(Match.stage == selected_stage)
    ) or 0
    participants = await session.scalar(
        select(func.count(distinct(Prediction.user_id)))
        .join(Match, Match.id == Prediction.match_id)
        .where(Match.stage == selected_stage)
    ) or 0

    labels = await _match_labels(session)
    highlights: list[RoundFeedHighlight] = []

    most_predicted = (
        await session.execute(
            select(Match.id, Match.starts_at, func.count(Prediction.id).label("predictions"))
            .join(Prediction, Prediction.match_id == Match.id)
            .where(Match.stage == selected_stage)
            .group_by(Match.id, Match.starts_at)
            .order_by(desc("predictions"), Match.starts_at)
            .limit(1)
        )
    ).mappings().first()
    if most_predicted:
        highlights.append(
            RoundFeedHighlight(
                label="Jogo mais apostado",
                value=labels.get(most_predicted["id"], "Jogo"),
                detail=f"{int(most_predicted['predictions'])} palpites",
            )
        )

    popular_score = (
        await session.execute(
            select(
                func.concat(Prediction.home_score, " x ", Prediction.away_score).label("score"),
                func.count(Prediction.id).label("count"),
            )
            .join(Match, Match.id == Prediction.match_id)
            .where(Match.stage == selected_stage)
            .group_by("score")
            .order_by(desc("count"))
            .limit(1)
        )
    ).mappings().first()
    if popular_score:
        highlights.append(
            RoundFeedHighlight(
                label="Placar favorito",
                value=popular_score["score"],
                detail=f"{int(popular_score['count'])} apostas",
            )
        )

    most_diverse = (
        await session.execute(
            select(
                Match.id,
                func.count(distinct(func.concat(Prediction.home_score, ":", Prediction.away_score))).label("scores"),
            )
            .join(Prediction, Prediction.match_id == Match.id)
            .where(Match.stage == selected_stage)
            .group_by(Match.id)
            .order_by(desc("scores"))
            .limit(1)
        )
    ).mappings().first()
    if most_diverse:
        highlights.append(
            RoundFeedHighlight(
                label="Maior divergência",
                value=labels.get(most_diverse["id"], "Jogo"),
                detail=f"{int(most_diverse['scores'])} placares diferentes",
            )
        )

    ranking_rows = await RankingService(session).individual_by_stage(stage=selected_stage, limit=5)
    ranking = [
        RoundRankingItem(
            id=row["id"],
            full_name=row["full_name"],
            company_name=row["company_name"],
            points=int(row["points"] or 0),
            predictions=int(row["predictions"] or 0),
            rank=int(row["rank"]),
        )
        for row in ranking_rows
    ]

    return RoundFeed(
        stage=selected_stage,
        matches=int(matches),
        predictions=int(predictions),
        participants=int(participants),
        highlights=highlights,
        ranking=ranking,
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


async def _current_stage(session: AsyncSession) -> str | None:
    upcoming = await session.scalar(
        select(Match.stage)
        .where(Match.status.in_([MatchStatus.SCHEDULED, MatchStatus.LIVE]))
        .order_by(Match.starts_at)
        .limit(1)
    )
    if upcoming:
        return upcoming

    return await session.scalar(select(Match.stage).order_by(desc(Match.starts_at)).limit(1))


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
