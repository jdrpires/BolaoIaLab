from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.predictions import PredictionService
from app.application.football_sync import FootballSyncService, default_sync_window
from app.domain.entities import Match, MatchStatus, Team
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import require_admin
from app.schemas.common import (
    FixtureSyncRequest,
    FixtureSyncResult,
    MatchCreate,
    MatchRead,
    MatchResultUpdate,
    MatchUpdate,
    TeamCreate,
    TeamRead,
    TeamUpdate,
)

router = APIRouter(tags=["matches"])


@router.get("/teams", response_model=list[TeamRead])
async def list_teams(session: AsyncSession = Depends(get_session)) -> list[Team]:
    return list((await session.execute(select(Team).order_by(Team.name))).scalars().all())


@router.post("/teams", response_model=TeamRead, dependencies=[Depends(require_admin)])
async def create_team(payload: TeamCreate, session: AsyncSession = Depends(get_session)) -> Team:
    team = Team(**payload.model_dump())
    session.add(team)
    await session.commit()
    await session.refresh(team)
    return team


@router.patch("/teams/{team_id}", response_model=TeamRead, dependencies=[Depends(require_admin)])
async def update_team(team_id: UUID, payload: TeamUpdate, session: AsyncSession = Depends(get_session)) -> Team:
    team = await session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(team, field, value)
    await session.commit()
    await session.refresh(team)
    return team


@router.get("/matches", response_model=list[MatchRead])
async def list_matches(session: AsyncSession = Depends(get_session)) -> list[Match]:
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).order_by(Match.starts_at)
    return list((await session.execute(statement)).scalars().all())


@router.post("/matches", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def create_match(payload: MatchCreate, session: AsyncSession = Depends(get_session)) -> Match:
    match = Match(**payload.model_dump())
    session.add(match)
    await session.commit()
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match.id)
    return (await session.execute(statement)).scalar_one()


@router.post("/matches/sync-fixtures", response_model=FixtureSyncResult, dependencies=[Depends(require_admin)])
async def sync_fixtures(payload: FixtureSyncRequest, session: AsyncSession = Depends(get_session)) -> dict:
    from_date, to_date = default_sync_window()
    result = await FootballSyncService(session).sync_fixtures(
        league=payload.league,
        season=payload.season,
        from_date=payload.from_date or from_date,
        to_date=payload.to_date or to_date,
        team=payload.team,
    )
    return result.as_dict()


@router.post("/matches/sync-results", response_model=FixtureSyncResult, dependencies=[Depends(require_admin)])
async def sync_results(session: AsyncSession = Depends(get_session)) -> dict:
    result = await FootballSyncService(session).sync_existing_results()
    return result.as_dict()


@router.patch("/matches/{match_id}", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def update_match(match_id: UUID, payload: MatchUpdate, session: AsyncSession = Depends(get_session)) -> Match:
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] is not None:
        data["status"] = MatchStatus(data["status"])
    for field, value in data.items():
        setattr(match, field, value)
    await session.commit()
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match.id)
    return (await session.execute(statement)).scalar_one()


@router.patch("/matches/{match_id}/result", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def update_match_result(match_id: UUID, payload: MatchResultUpdate, session: AsyncSession = Depends(get_session)) -> Match:
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    match.home_score = payload.home_score
    match.away_score = payload.away_score
    match.status = MatchStatus.FINISHED
    await PredictionService(session).score_match_predictions(match)
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match.id)
    return (await session.execute(statement)).scalar_one()


@router.post("/matches/{match_id}/recalculate", dependencies=[Depends(require_admin)])
async def recalculate_match(match_id: UUID, session: AsyncSession = Depends(get_session)) -> dict:
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    count = await PredictionService(session).score_match_predictions(match)
    return {"match_id": match.id, "predictions_scored": count}
