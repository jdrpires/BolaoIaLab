from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import Company, Match, Prediction, User


class RankingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def individual(self, limit: int = 100) -> list[dict]:
        statement = (
            select(
                User.id,
                User.full_name,
                User.email,
                Company.name.label("company_name"),
                func.coalesce(func.sum(Prediction.points), 0).label("points"),
                func.count(Prediction.id).label("predictions"),
            )
            .select_from(User)
            .outerjoin(Company, Company.id == User.company_id)
            .outerjoin(Prediction, Prediction.user_id == User.id)
            .where(User.is_active.is_(True))
            .group_by(User.id, Company.name)
            .order_by(desc("points"), User.full_name)
            .limit(limit)
        )
        rows = (await self.session.execute(statement)).mappings().all()
        return [{**dict(row), "rank": index + 1} for index, row in enumerate(rows)]

    async def individual_by_stage(self, stage: str, limit: int = 20) -> list[dict]:
        statement = (
            select(
                User.id,
                User.full_name,
                User.email,
                Company.name.label("company_name"),
                func.coalesce(func.sum(Prediction.points), 0).label("points"),
                func.count(Prediction.id).label("predictions"),
            )
            .select_from(User)
            .outerjoin(Company, Company.id == User.company_id)
            .join(Prediction, Prediction.user_id == User.id)
            .join(Match, Match.id == Prediction.match_id)
            .where(User.is_active.is_(True), Match.stage == stage)
            .group_by(User.id, Company.name)
            .order_by(desc("points"), desc("predictions"), User.full_name)
            .limit(limit)
        )
        rows = (await self.session.execute(statement)).mappings().all()
        return [{**dict(row), "rank": index + 1} for index, row in enumerate(rows)]

    async def companies(self) -> list[dict]:
        statement = (
            select(
                Company.id,
                Company.name,
                Company.color,
                func.count(func.distinct(User.id)).label("participants"),
                func.coalesce(func.sum(Prediction.points), 0).label("total_points"),
            )
            .select_from(Company)
            .outerjoin(User, User.company_id == Company.id)
            .outerjoin(Prediction, Prediction.user_id == User.id)
            .where(Company.is_active.is_(True))
            .group_by(Company.id)
            .order_by(desc("total_points"), Company.name)
        )
        rows = (await self.session.execute(statement)).mappings().all()
        ranking = []
        for index, row in enumerate(rows):
            data = dict(row)
            participants = data["participants"] or 0
            total = int(data["total_points"] or 0)
            data["rank"] = index + 1
            data["total_points"] = total
            data["avg_points"] = round(total / participants, 2) if participants else 0
            ranking.append(data)
        return ranking
