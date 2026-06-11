from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.predictions import PredictionService
from app.core import get_settings
from app.domain.entities import Match, MatchStatus, Team
from app.infrastructure.external.api_football import ApiFootballClient


@dataclass(slots=True)
class FootballSyncResult:
    mode: str
    fixtures_checked: int = 0
    teams_created: int = 0
    teams_updated: int = 0
    matches_created: int = 0
    matches_updated: int = 0
    results_updated: int = 0
    predictions_scored: int = 0
    skipped: int = 0
    message: str | None = None

    def as_dict(self) -> dict[str, int | str | None]:
        return {
            "mode": self.mode,
            "fixtures_checked": self.fixtures_checked,
            "teams_created": self.teams_created,
            "teams_updated": self.teams_updated,
            "matches_created": self.matches_created,
            "matches_updated": self.matches_updated,
            "results_updated": self.results_updated,
            "predictions_scored": self.predictions_scored,
            "skipped": self.skipped,
            "message": self.message,
        }


class FootballSyncService:
    def __init__(self, session: AsyncSession, client: ApiFootballClient | None = None) -> None:
        self.session = session
        self.client = client or ApiFootballClient()
        self.scoring = PredictionService(session)

    async def sync_fixtures(
        self,
        *,
        league: int | None = None,
        season: int | None = None,
        from_date: date | None = None,
        to_date: date | None = None,
        team: int | None = None,
    ) -> FootballSyncResult:
        settings = get_settings()
        if not settings.api_football_key:
            return FootballSyncResult(mode="mock", message="Configure API_FOOTBALL_KEY para sincronizar dados reais.")

        payload = await self.client.fixtures(
            league=league or settings.api_football_default_league,
            season=season or settings.api_football_default_season,
            from_date=from_date,
            to_date=to_date,
            team=team,
        )
        result = FootballSyncResult(mode="live")
        if payload.get("errors"):
            result.message = f"API-Football retornou erro: {payload['errors']}"
            return result
        for item in payload.get("response", []):
            await self._upsert_fixture(item, result)
        if result.fixtures_checked == 0:
            result.message = "API-Football não retornou fixtures para os filtros informados."
        await self.session.commit()
        return result

    async def sync_existing_results(self) -> FootballSyncResult:
        settings = get_settings()
        if not settings.api_football_key:
            return FootballSyncResult(mode="mock", message="Configure API_FOOTBALL_KEY para atualizar resultados reais.")

        fixture_ids = list(
            (
                await self.session.execute(
                    select(Match.external_fixture_id).where(
                        Match.external_fixture_id.is_not(None),
                        Match.status != MatchStatus.CANCELLED,
                    )
                )
            )
            .scalars()
            .all()
        )
        result = FootballSyncResult(mode="live")
        for fixture_id in fixture_ids:
            payload = await self.client.fixture(fixture_id)
            if payload.get("errors"):
                result.skipped += 1
                result.message = f"API-Football retornou erro: {payload['errors']}"
                continue
            fixtures = payload.get("response", [])
            if not fixtures:
                result.skipped += 1
                continue
            await self._upsert_fixture(fixtures[0], result)
        await self.session.commit()
        return result

    async def _upsert_fixture(self, item: dict[str, Any], result: FootballSyncResult) -> None:
        result.fixtures_checked += 1
        fixture = item.get("fixture") or {}
        teams = item.get("teams") or {}
        goals = item.get("goals") or {}
        league = item.get("league") or {}
        fixture_id = fixture.get("id")
        if not fixture_id:
            result.skipped += 1
            return

        home_team = await self._upsert_team(teams.get("home") or {}, result)
        away_team = await self._upsert_team(teams.get("away") or {}, result)
        if not home_team or not away_team:
            result.skipped += 1
            return

        starts_at = _parse_datetime(fixture.get("date"))
        if not starts_at:
            result.skipped += 1
            return

        match = (
            await self.session.execute(select(Match).where(Match.external_fixture_id == str(fixture_id)))
        ).scalar_one_or_none()
        status = _map_status((fixture.get("status") or {}).get("short"))
        metadata = _compact_fixture_payload(item)
        if not match:
            match = Match(
                external_fixture_id=str(fixture_id),
                home_team_id=home_team.id,
                away_team_id=away_team.id,
                starts_at=starts_at,
                stage=_stage_name(league),
                status=status,
                metadata_json=metadata,
            )
            self.session.add(match)
            result.matches_created += 1
        else:
            match.home_team_id = home_team.id
            match.away_team_id = away_team.id
            match.starts_at = starts_at
            match.stage = _stage_name(league)
            match.status = status
            match.metadata_json = {**(match.metadata_json or {}), **metadata}
            result.matches_updated += 1

        if status == MatchStatus.FINISHED and goals.get("home") is not None and goals.get("away") is not None:
            old_score = (match.home_score, match.away_score, match.status)
            match.home_score = int(goals["home"])
            match.away_score = int(goals["away"])
            if old_score != (match.home_score, match.away_score, match.status):
                result.results_updated += 1
            result.predictions_scored += await self.scoring.score_match_predictions(match)

    async def _upsert_team(self, payload: dict[str, Any], result: FootballSyncResult) -> Team | None:
        external_id = payload.get("id")
        name = payload.get("name")
        if not external_id or not name:
            return None

        team = (
            await self.session.execute(select(Team).where(Team.external_id == str(external_id)))
        ).scalar_one_or_none()
        if not team:
            team = (await self.session.execute(select(Team).where(Team.name == name))).scalar_one_or_none()
        short_name = _short_name(name)
        if not team:
            team = Team(
                external_id=str(external_id),
                name=name,
                short_name=short_name,
                logo_url=payload.get("logo"),
            )
            self.session.add(team)
            result.teams_created += 1
            return team

        changed = False
        for field, value in {
            "external_id": str(external_id),
            "name": name,
            "short_name": short_name,
            "logo_url": payload.get("logo"),
        }.items():
            if value and getattr(team, field) != value:
                setattr(team, field, value)
                changed = True
        if changed:
            result.teams_updated += 1
        return team


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed


def _map_status(value: str | None) -> MatchStatus:
    if value in {"1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"}:
        return MatchStatus.LIVE
    if value in {"FT", "AET", "PEN"}:
        return MatchStatus.FINISHED
    if value in {"CANC", "ABD", "AWD", "WO"}:
        return MatchStatus.CANCELLED
    return MatchStatus.SCHEDULED


def _short_name(name: str) -> str:
    words = [word for word in name.replace("-", " ").split() if word]
    if len(words) >= 2:
        return "".join(word[0] for word in words[:3]).upper()[:8]
    return name[:3].upper()


def _stage_name(league: dict[str, Any]) -> str:
    round_name = league.get("round")
    if round_name:
        return str(round_name)
    name = league.get("name")
    season = league.get("season")
    return " · ".join(str(part) for part in [name, season] if part) or "API-Football"


def _compact_fixture_payload(item: dict[str, Any]) -> dict[str, Any]:
    fixture = item.get("fixture") or {}
    league = item.get("league") or {}
    score = item.get("score") or {}
    return {
        "source": "api-football",
        "fixture": {
            "id": fixture.get("id"),
            "referee": fixture.get("referee"),
            "timezone": fixture.get("timezone"),
            "venue": fixture.get("venue"),
            "status": fixture.get("status"),
        },
        "league": {
            "id": league.get("id"),
            "name": league.get("name"),
            "country": league.get("country"),
            "season": league.get("season"),
            "round": league.get("round"),
        },
        "score": score,
        "synced_at": datetime.now(UTC).isoformat(),
    }


def default_sync_window() -> tuple[date, date]:
    today = datetime.now(UTC).date()
    return today - timedelta(days=2), today + timedelta(days=14)
