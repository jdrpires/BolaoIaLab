import type { ApiIndividualRanking, ApiMatch, ApiTeam } from "@/lib/api/types";

export function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(value),
  );
}

export function formatMatchTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}

export function teamMark(team: ApiTeam) {
  return team.logo_url ? "" : team.short_name.slice(0, 3).toUpperCase();
}

export function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function toRankingPlayer(row: ApiIndividualRanking) {
  return {
    rank: row.rank,
    name: row.full_name,
    company: row.company_name ?? "Sem empresa",
    avatar: initials(row.full_name),
    points: Number(row.points ?? 0),
    trend: 0,
    hits: Number(row.predictions ?? 0),
  };
}

export function isFinished(match: ApiMatch) {
  return match.status === "finished" && match.home_score != null && match.away_score != null;
}
