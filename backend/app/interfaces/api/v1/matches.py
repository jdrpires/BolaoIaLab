from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.audit import record_audit_event
from app.application.predictions import PredictionService
from app.application.football_sync import FootballSyncService, default_sync_window
from app.domain.entities import Match, MatchStatus, Team, User
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
async def create_team(
    payload: TeamCreate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> Team:
    team = Team(**payload.model_dump())
    session.add(team)
    await session.flush()
    await record_audit_event(
        session,
        action="team.created",
        target_type="team",
        target_id=team.id,
        actor=actor,
        metadata=payload.model_dump(),
    )
    await session.commit()
    await session.refresh(team)
    return team


@router.patch("/teams/{team_id}", response_model=TeamRead, dependencies=[Depends(require_admin)])
async def update_team(
    team_id: UUID,
    payload: TeamUpdate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> Team:
    team = await session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    updates = payload.model_dump(exclude_unset=True)
    before = {field: getattr(team, field) for field in updates}
    for field, value in updates.items():
        setattr(team, field, value)
    await record_audit_event(
        session,
        action="team.updated",
        target_type="team",
        target_id=team.id,
        actor=actor,
        metadata={"before": before, "after": updates},
    )
    await session.commit()
    await session.refresh(team)
    return team


@router.get("/matches", response_model=list[MatchRead])
async def list_matches(session: AsyncSession = Depends(get_session)) -> list[Match]:
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).order_by(Match.starts_at)
    return list((await session.execute(statement)).scalars().all())


@router.post("/matches", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def create_match(
    payload: MatchCreate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> Match:
    match = Match(**payload.model_dump())
    session.add(match)
    await session.flush()
    await record_audit_event(
        session,
        action="match.created",
        target_type="match",
        target_id=match.id,
        actor=actor,
        metadata=payload.model_dump(),
    )
    await session.commit()
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match.id)
    return (await session.execute(statement)).scalar_one()


@router.post("/matches/sync-fixtures", response_model=FixtureSyncResult, dependencies=[Depends(require_admin)])
async def sync_fixtures(
    payload: FixtureSyncRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    from_date, to_date = default_sync_window()
    result = await FootballSyncService(session).sync_fixtures(
        league=payload.league,
        season=payload.season,
        from_date=payload.from_date or from_date,
        to_date=payload.to_date or to_date,
        team=payload.team,
    )
    result_payload = result.as_dict()
    await record_audit_event(
        session,
        action="football.fixtures_synced",
        target_type="api_football",
        actor=actor,
        metadata={"request": payload.model_dump(), "result": result_payload},
    )
    await session.commit()
    return result_payload


@router.post("/matches/sync-results", response_model=FixtureSyncResult, dependencies=[Depends(require_admin)])
async def sync_results(
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    result = await FootballSyncService(session).sync_existing_results()
    result_payload = result.as_dict()
    await record_audit_event(
        session,
        action="football.results_synced",
        target_type="api_football",
        actor=actor,
        metadata={"result": result_payload},
    )
    await session.commit()
    return result_payload


@router.patch("/matches/{match_id}", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def update_match(
    match_id: UUID,
    payload: MatchUpdate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> Match:
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    data = payload.model_dump(exclude_unset=True)
    before = {field: getattr(match, field) for field in data}
    if "status" in data and data["status"] is not None:
        data["status"] = MatchStatus(data["status"])
    for field, value in data.items():
        setattr(match, field, value)
    await record_audit_event(
        session,
        action="match.updated",
        target_type="match",
        target_id=match.id,
        actor=actor,
        metadata={"before": before, "after": data},
    )
    await session.commit()
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match.id)
    return (await session.execute(statement)).scalar_one()


@router.patch("/matches/{match_id}/result", response_model=MatchRead, dependencies=[Depends(require_admin)])
async def update_match_result(
    match_id: UUID,
    payload: MatchResultUpdate,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> Match:
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    before = {"home_score": match.home_score, "away_score": match.away_score, "status": match.status}
    match.home_score = payload.home_score
    match.away_score = payload.away_score
    match.status = MatchStatus.FINISHED
    predictions_scored = await PredictionService(session).score_match_predictions(match)
    await record_audit_event(
        session,
        action="match.result_updated",
        target_type="match",
        target_id=match.id,
        actor=actor,
        metadata={
            "before": before,
            "after": {"home_score": match.home_score, "away_score": match.away_score, "status": match.status},
            "predictions_scored": predictions_scored,
        },
    )
    await session.commit()
    statement = select(Match).options(selectinload(Match.home_team), selectinload(Match.away_team)).where(Match.id == match.id)
    return (await session.execute(statement)).scalar_one()


@router.post("/matches/{match_id}/recalculate", dependencies=[Depends(require_admin)])
async def recalculate_match(
    match_id: UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    count = await PredictionService(session).score_match_predictions(match)
    await record_audit_event(
        session,
        action="match.score_recalculated",
        target_type="match",
        target_id=match.id,
        actor=actor,
        metadata={"predictions_scored": count},
    )
    await session.commit()
    return {"match_id": match.id, "predictions_scored": count}
