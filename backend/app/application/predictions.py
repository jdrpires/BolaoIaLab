from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.scoring import PredictionScoringService
from app.domain.entities import Match, MatchStatus, Prediction


class PredictionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.scoring = PredictionScoringService()

    async def upsert_prediction(self, user_id: UUID, match_id: UUID, home_score: int, away_score: int) -> Prediction:
        match = await self.session.get(Match, match_id)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        if match.status != MatchStatus.SCHEDULED or match.starts_at <= datetime.now(UTC):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Predictions are closed for this match")

        result = await self.session.execute(
            select(Prediction).where(Prediction.user_id == user_id, Prediction.match_id == match_id)
        )
        prediction = result.scalar_one_or_none()
        if prediction is None:
            prediction = Prediction(user_id=user_id, match_id=match_id, home_score=home_score, away_score=away_score)
            self.session.add(prediction)
        else:
            prediction.home_score = home_score
            prediction.away_score = away_score

        await self.session.commit()
        await self.session.refresh(prediction)
        return prediction

    async def score_match_predictions(self, match: Match) -> int:
        if match.home_score is None or match.away_score is None:
            return 0
        result = await self.session.execute(select(Prediction).where(Prediction.match_id == match.id))
        predictions = result.scalars().all()
        for prediction in predictions:
            breakdown = self.scoring.calculate(
                prediction.home_score,
                prediction.away_score,
                match.home_score,
                match.away_score,
            )
            prediction.points = breakdown.points
            prediction.scored_at = datetime.now(UTC)
        await self.session.commit()
        return len(predictions)
