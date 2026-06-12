from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.scoring import PredictionScoringService
from app.application.scoring_rules import get_active_scoring_rule, to_scoring_rules
from app.domain.entities import GameAnalysis, Match, MatchStatus, Prediction


class PredictionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upsert_prediction(self, user_id: UUID, match_id: UUID, home_score: int, away_score: int) -> Prediction:
        match = await self.session.get(Match, match_id)
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        rule = await get_active_scoring_rule(self.session)
        closes_at = match.starts_at - timedelta(minutes=rule.lock_minutes_before_match)
        if match.status != MatchStatus.SCHEDULED or closes_at <= datetime.now(UTC):
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
        rule = await get_active_scoring_rule(self.session)
        scoring = PredictionScoringService(to_scoring_rules(rule))
        underdog_outcome = await self._underdog_outcome(match.id)
        result = await self.session.execute(select(Prediction).where(Prediction.match_id == match.id))
        predictions = result.scalars().all()
        for prediction in predictions:
            breakdown = scoring.calculate(
                prediction.home_score,
                prediction.away_score,
                match.home_score,
                match.away_score,
                underdog_outcome=underdog_outcome,
            )
            prediction.points = breakdown.points
            prediction.scored_at = datetime.now(UTC)
        await self.session.commit()
        return len(predictions)

    async def _underdog_outcome(self, match_id: UUID) -> str | None:
        statement = (
            select(GameAnalysis)
            .where(GameAnalysis.match_id == match_id)
            .order_by(desc(GameAnalysis.created_at))
            .limit(1)
        )
        analysis = (await self.session.execute(statement)).scalar_one_or_none()
        if not analysis:
            return None

        probabilities = (analysis.payload or {}).get("probabilities") or {}
        values = {
            "home": _probability(probabilities, "home", "home_win"),
            "draw": _probability(probabilities, "draw"),
            "away": _probability(probabilities, "away", "away_win"),
        }
        known = {outcome: value for outcome, value in values.items() if value is not None}
        if len(known) < 2:
            return None
        return min(known, key=known.get)


def _probability(payload: dict, *keys: str) -> float | None:
    for key in keys:
        value = payload.get(key)
        if value is not None:
            return float(value)
    return None
