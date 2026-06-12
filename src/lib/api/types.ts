export type ApiTeam = {
  id: string;
  external_id: string | null;
  name: string;
  short_name: string;
  logo_url: string | null;
};

export type ApiMatch = {
  id: string;
  external_fixture_id: string | null;
  home_team: ApiTeam;
  away_team: ApiTeam;
  starts_at: string;
  stage: string;
  status: "scheduled" | "live" | "finished" | "cancelled";
  home_score: number | null;
  away_score: number | null;
};

export type MatchStatus = ApiMatch["status"];

export type ApiIndividualRanking = {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  points: number;
  predictions: number;
  rank: number;
};

export type ApiCompanyRanking = {
  id: string;
  name: string;
  color: string | null;
  participants: number;
  total_points: number;
  avg_points: number;
  rank: number;
};

export type ApiCompany = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  color: string | null;
  is_active: boolean;
};

export type ApiUser = {
  id: string;
  company_id: string | null;
  company: ApiCompany | null;
  email: string;
  full_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  role: "admin" | "player";
};

export type ApiPrediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number;
};

export type UpsertPredictionPayload = {
  match_id: string;
  home_score: number;
  away_score: number;
};

export type CreateCompanyPayload = {
  name: string;
  slug: string;
  domain?: string | null;
  color?: string | null;
};

export type CreateTeamPayload = {
  name: string;
  short_name: string;
  external_id?: string | null;
  logo_url?: string | null;
};

export type CreateMatchPayload = {
  home_team_id: string;
  away_team_id: string;
  starts_at: string;
  stage: string;
  external_fixture_id?: string | null;
};

export type UpdateMatchResultPayload = {
  home_score: number;
  away_score: number;
};

export type UpdateMyCompanyPayload = {
  company_id: string;
};

export type UpdateMyPhonePayload = {
  phone_number: string | null;
};

export type UpdateCompanyPayload = Partial<CreateCompanyPayload> & {
  is_active?: boolean;
};

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

export type UpdateMatchPayload = Partial<CreateMatchPayload> & {
  status?: MatchStatus;
};

export type UpdateUserPayload = {
  role?: "admin" | "player";
  company_id?: string | null;
  phone_number?: string | null;
  is_active?: boolean;
};

export type SyncFixturesPayload = {
  league?: number | null;
  season?: number | null;
  from_date?: string | null;
  to_date?: string | null;
  team?: number | null;
};

export type ApiFixtureSyncResult = {
  mode: string;
  fixtures_checked: number;
  teams_created: number;
  teams_updated: number;
  matches_created: number;
  matches_updated: number;
  results_updated: number;
  predictions_scored: number;
  skipped: number;
  message: string | null;
};

export type ApiNotification = {
  id: string;
  user_id: string;
  channel: string;
  destination: string;
  message: string;
  status: string;
  provider_message_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ApiStatisticsOverview = {
  kpis: {
    participants: number;
    companies: number;
    matches: number;
    predictions: number;
    analyses: number;
    accuracy: number;
  };
  predictions_by_match: Array<{
    match_id: string;
    label: string;
    starts_at: string;
    predictions: number;
  }>;
  popular_scores: Array<{
    score: string;
    count: number;
  }>;
  daily_activity: Array<{
    day: string;
    predictions: number;
    analyses: number;
  }>;
  company_distribution: Array<{
    id: string;
    name: string;
    color: string | null;
    participants: number;
  }>;
};

export type ApiRoundFeed = {
  stage: string | null;
  matches: number;
  predictions: number;
  participants: number;
  highlights: Array<{
    label: string;
    value: string;
    detail: string | null;
  }>;
  ranking: Array<{
    id: string;
    full_name: string;
    company_name: string | null;
    points: number;
    predictions: number;
    rank: number;
  }>;
};

export type ApiGameAnalysis = {
  id: string;
  match_id: string;
  provider: string;
  model: string;
  summary: string;
  suggested_home_score: number;
  suggested_away_score: number;
  confidence: number;
  payload: {
    probabilities?: {
      home?: number;
      draw?: number;
      away?: number;
    };
    [key: string]: unknown;
  };
};
