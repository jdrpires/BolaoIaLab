from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.predictions import PredictionService
from app.domain.entities import Prediction, User
from app.infrastructure.db.session import get_session
from app.interfaces.api.dependencies import get_current_user
from app.schemas.common import PredictionRead, PredictionUpsert

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/mine", response_model=list[PredictionRead])
async def my_predictions(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> list[Prediction]:
    result = await session.execute(select(Prediction).where(Prediction.user_id == user.id).order_by(Prediction.created_at.desc()))
    return list(result.scalars().all())


@router.put("", response_model=PredictionRead)
async def upsert_prediction(
    payload: PredictionUpsert,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Prediction:
    return await PredictionService(session).upsert_prediction(user.id, payload.match_id, payload.home_score, payload.away_score)
