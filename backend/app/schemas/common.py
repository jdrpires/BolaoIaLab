from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=180)
    domain: str | None = None
    color: str | None = None


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: str | None = Field(default=None, min_length=2, max_length=180)
    domain: str | None = None
    color: str | None = None
    is_active: bool | None = None


class CompanyRead(ApiModel):
    id: UUID
    name: str
    slug: str
    domain: str | None
    color: str | None
    is_active: bool


class UserRead(ApiModel):
    id: UUID
    company_id: UUID | None
    company: CompanyRead | None = None
    email: str
    full_name: str
    phone_number: str | None = None
    avatar_url: str | None
    role: str


class UserCompanyUpdate(BaseModel):
    company_id: UUID


class TeamCreate(BaseModel):
    name: str
    short_name: str
    external_id: str | None = None
    logo_url: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = None
    short_name: str | None = None
    external_id: str | None = None
    logo_url: str | None = None


class TeamRead(ApiModel):
    id: UUID
    external_id: str | None
    name: str
    short_name: str
    logo_url: str | None


class MatchCreate(BaseModel):
    home_team_id: UUID
    away_team_id: UUID
    starts_at: datetime
    stage: str
    external_fixture_id: str | None = None


class MatchUpdate(BaseModel):
    home_team_id: UUID | None = None
    away_team_id: UUID | None = None
    starts_at: datetime | None = None
    stage: str | None = None
    external_fixture_id: str | None = None
    status: str | None = None


class MatchResultUpdate(BaseModel):
    home_score: int = Field(ge=0, le=99)
    away_score: int = Field(ge=0, le=99)


class FixtureSyncRequest(BaseModel):
    league: int | None = Field(default=None, ge=1)
    season: int | None = Field(default=None, ge=1900, le=2200)
    from_date: date | None = None
    to_date: date | None = None
    team: int | None = Field(default=None, ge=1)


class FixtureSyncResult(BaseModel):
    mode: str
    fixtures_checked: int
    teams_created: int
    teams_updated: int
    matches_created: int
    matches_updated: int
    results_updated: int
    predictions_scored: int
    skipped: int
    message: str | None = None


class MatchRead(ApiModel):
    id: UUID
    external_fixture_id: str | None
    home_team: TeamRead
    away_team: TeamRead
    starts_at: datetime
    stage: str
    status: str
    home_score: int | None
    away_score: int | None


class PredictionUpsert(BaseModel):
    match_id: UUID
    home_score: int = Field(ge=0, le=99)
    away_score: int = Field(ge=0, le=99)


class PredictionRead(ApiModel):
    id: UUID
    user_id: UUID
    match_id: UUID
    home_score: int
    away_score: int
    points: int


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class GameAnalysisRead(ApiModel):
    id: UUID
    match_id: UUID
    provider: str
    model: str
    summary: str
    suggested_home_score: int
    suggested_away_score: int
    confidence: float
    payload: dict


class NotificationCreate(BaseModel):
    user_id: UUID
    destination: str
    message: str


class NotificationRead(ApiModel):
    id: UUID
    user_id: UUID
    channel: str
    destination: str
    message: str
    status: str
    provider_message_id: str | None
    payload: dict
    created_at: datetime


class StatisticsKpis(BaseModel):
    participants: int
    companies: int
    matches: int
    predictions: int
    analyses: int
    accuracy: float


class PredictionsByMatch(BaseModel):
    match_id: UUID
    label: str
    starts_at: datetime
    predictions: int


class PopularScore(BaseModel):
    score: str
    count: int


class DailyActivity(BaseModel):
    day: str
    predictions: int
    analyses: int


class CompanyDistribution(BaseModel):
    id: UUID
    name: str
    color: str | None
    participants: int


class StatisticsOverview(BaseModel):
    kpis: StatisticsKpis
    predictions_by_match: list[PredictionsByMatch]
    popular_scores: list[PopularScore]
    daily_activity: list[DailyActivity]
    company_distribution: list[CompanyDistribution]


class RoundFeedHighlight(BaseModel):
    label: str
    value: str
    detail: str | None = None


class RoundRankingItem(BaseModel):
    id: UUID
    full_name: str
    company_name: str | None
    points: int
    predictions: int
    rank: int


class RoundFeed(BaseModel):
    stage: str | None
    matches: int
    predictions: int
    participants: int
    highlights: list[RoundFeedHighlight]
    ranking: list[RoundRankingItem]


class MatchNotificationPayload(BaseModel):
    match_id: UUID


class UpcomingReminderPayload(BaseModel):
    minutes_before: int = Field(default=60, ge=1, le=1440)


class UserAdminUpdate(BaseModel):
    role: str | None = Field(default=None, pattern="^(admin|player)$")
    company_id: UUID | None = None
    phone_number: str | None = None
    is_active: bool | None = None
