from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import get_settings
from app.domain.entities import GameAnalysis, Match
from app.infrastructure.db.session import get_session
from app.infrastructure.external.api_football import ApiFootballClient
from app.infrastructure.external.openai_analysis import OpenAIGameAnalysisClient
from app.interfaces.api.dependencies import get_current_user
from app.schemas.common import GameAnalysisRead

router = APIRouter(prefix="/analysis", tags=["ai-analysis"])


@router.get("/matches/{match_id}", response_model=GameAnalysisRead, dependencies=[Depends(get_current_user)])
async def get_match_analysis(match_id: UUID, session: AsyncSession = Depends(get_session)) -> GameAnalysis:
    analysis = await _latest_analysis(match_id, session)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis


@router.post("/matches/{match_id}", response_model=GameAnalysisRead, dependencies=[Depends(get_current_user)])
async def analyze_match(
    match_id: UUID,
    force: bool = Query(default=False),
    session: AsyncSession = Depends(get_session),
) -> GameAnalysis:
    if not force:
        analysis = await _latest_analysis(match_id, session)
        if analysis:
            return analysis

    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match_id)
    match = (await session.execute(statement)).scalar_one_or_none()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    sports_payload = {}
    if match.external_fixture_id:
        sports_payload = await ApiFootballClient().fixture_analysis_payload(match.external_fixture_id)

    payload = await OpenAIGameAnalysisClient().analyze(match, sports_payload)
    settings = get_settings()
    analysis = GameAnalysis(
        match_id=match.id,
        provider="openai",
        model=settings.openai_model,
        summary=payload["summary"],
        suggested_home_score=int(payload["suggested_home_score"]),
        suggested_away_score=int(payload["suggested_away_score"]),
        confidence=float(payload["confidence"]),
        payload=payload,
    )
    session.add(analysis)
    await session.commit()
    await session.refresh(analysis)
    return analysis


async def _latest_analysis(match_id: UUID, session: AsyncSession) -> GameAnalysis | None:
    statement = (
        select(GameAnalysis)
        .where(GameAnalysis.match_id == match_id)
        .order_by(desc(GameAnalysis.created_at))
        .limit(1)
    )
    return (await session.execute(statement)).scalar_one_or_none()
