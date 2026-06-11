import httpx
from datetime import date

from app.core import get_settings


class ApiFootballClient:
    async def fixtures(
        self,
        *,
        league: int | None = None,
        season: int | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
        team: int | None = None,
    ) -> dict:
        params: dict[str, str | int] = {}
        if league:
            params["league"] = league
        if season:
            params["season"] = season
        if from_date:
            params["from"] = from_date.isoformat()
        if to_date:
            params["to"] = to_date.isoformat()
        if team:
            params["team"] = team
        return await self._get("/fixtures", params=params)

    async def fixture(self, fixture_id: str) -> dict:
        return await self._get("/fixtures", params={"id": fixture_id})

    async def fixture_statistics(self, fixture_id: str) -> dict:
        return await self._get("/fixtures/statistics", params={"fixture": fixture_id})

    async def fixture_analysis_payload(self, fixture_id: str) -> dict:
        fixture_payload = await self.fixture(fixture_id)
        statistics_payload = await self.fixture_statistics(fixture_id)
        return {
            "fixture": fixture_payload,
            "statistics": statistics_payload,
        }

    async def _get(self, path: str, params: dict) -> dict:
        settings = get_settings()
        if not settings.api_football_key:
            return {"mode": "mock", "path": path, "params": params, "response": []}
        async with httpx.AsyncClient(base_url=settings.api_football_base_url, timeout=20) as client:
            response = await client.get(
                path,
                params=params,
                headers={"x-apisports-key": settings.api_football_key},
            )
            response.raise_for_status()
            return response.json()
