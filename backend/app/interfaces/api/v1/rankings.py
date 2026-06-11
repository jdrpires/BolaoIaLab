from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.rankings import RankingService
from app.infrastructure.db.session import get_session

router = APIRouter(prefix="/rankings", tags=["rankings"])


@router.get("/individual")
async def individual_ranking(
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    return await RankingService(session).individual(limit=limit)


@router.get("/companies")
async def company_ranking(session: AsyncSession = Depends(get_session)) -> list[dict]:
    return await RankingService(session).companies()
