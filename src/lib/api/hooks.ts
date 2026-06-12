import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost, apiPut, getAccessToken } from "@/lib/api/client";
import type {
  ApiAuditEvent,
  ApiCompany,
  ApiCompanyRanking,
  ApiGameAnalysis,
  ApiFixtureSyncResult,
  ApiIndividualRanking,
  ApiMatch,
  ApiNotification,
  ApiOperationalHealth,
  ApiPrediction,
  ApiRoundFeed,
  ApiStatisticsOverview,
  ApiTeam,
  ApiUser,
  CreateCompanyPayload,
  CreateMatchPayload,
  CreateTeamPayload,
  UpdateMatchResultPayload,
  UpdateMyCompanyPayload,
  UpdateCompanyPayload,
  UpdateMatchPayload,
  UpdateMyNotificationPreferencesPayload,
  UpdateMyPhonePayload,
  UpdateTeamPayload,
  UpdateUserPayload,
  SyncFixturesPayload,
  UpsertPredictionPayload,
} from "@/lib/api/types";

export const apiKeys = {
  matches: ["matches"] as const,
  teams: ["teams"] as const,
  companies: ["companies"] as const,
  individualRanking: ["rankings", "individual"] as const,
  companyRanking: ["rankings", "companies"] as const,
  roundRanking: (stage: string | null | undefined, limit: number) =>
    ["rankings", "round", stage ?? "current", limit] as const,
  users: ["users"] as const,
  notifications: ["notifications"] as const,
  auditEvents: ["admin", "audit-events"] as const,
  operationalHealth: ["admin", "health"] as const,
  statistics: ["statistics"] as const,
  roundFeed: ["statistics", "round-feed"] as const,
  me: ["auth", "me"] as const,
  myPredictions: ["predictions", "mine"] as const,
  analysis: (matchId: string) => ["analysis", matchId] as const,
};

export function useMatches() {
  return useQuery({
    queryKey: apiKeys.matches,
    queryFn: () => apiGet<ApiMatch[]>("/matches"),
    staleTime: 30_000,
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: apiKeys.companies,
    queryFn: () => apiGet<ApiCompany[]>("/companies"),
    staleTime: 60_000,
  });
}

export function useTeams() {
  return useQuery({
    queryKey: apiKeys.teams,
    queryFn: () => apiGet<ApiTeam[]>("/teams"),
    staleTime: 60_000,
  });
}

export function useIndividualRanking(limit = 100) {
  return useQuery({
    queryKey: [...apiKeys.individualRanking, limit],
    queryFn: () => apiGet<ApiIndividualRanking[]>(`/rankings/individual?limit=${limit}`),
    staleTime: 20_000,
  });
}

export function useCompanyRanking() {
  return useQuery({
    queryKey: apiKeys.companyRanking,
    queryFn: () => apiGet<ApiCompanyRanking[]>("/rankings/companies"),
    staleTime: 20_000,
  });
}

export function useRoundRanking(stage: string | null | undefined, limit = 20) {
  return useQuery({
    queryKey: apiKeys.roundRanking(stage, limit),
    queryFn: () =>
      apiGet<ApiIndividualRanking[]>(
        `/rankings/round?stage=${encodeURIComponent(stage ?? "")}&limit=${limit}`,
      ),
    enabled: Boolean(stage),
    staleTime: 20_000,
  });
}

export function useMe() {
  return useQuery({
    queryKey: apiKeys.me,
    queryFn: () => apiGet<ApiUser>("/auth/me"),
    enabled: Boolean(getAccessToken()),
    staleTime: 60_000,
    retry: false,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: apiKeys.users,
    queryFn: () => apiGet<ApiUser[]>("/users"),
    enabled: Boolean(getAccessToken()),
    staleTime: 30_000,
    retry: false,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: apiKeys.notifications,
    queryFn: () => apiGet<ApiNotification[]>("/notifications?limit=80"),
    enabled: Boolean(getAccessToken()),
    staleTime: 15_000,
    retry: false,
  });
}

export function useOperationalHealth() {
  return useQuery({
    queryKey: apiKeys.operationalHealth,
    queryFn: () => apiGet<ApiOperationalHealth>("/admin/health"),
    enabled: Boolean(getAccessToken()),
    staleTime: 15_000,
    retry: false,
  });
}

export function useAuditEvents(limit = 80) {
  return useQuery({
    queryKey: [...apiKeys.auditEvents, limit],
    queryFn: () => apiGet<ApiAuditEvent[]>(`/admin/audit-events?limit=${limit}`),
    enabled: Boolean(getAccessToken()),
    staleTime: 15_000,
    retry: false,
  });
}

export function useStatisticsOverview() {
  return useQuery({
    queryKey: apiKeys.statistics,
    queryFn: () => apiGet<ApiStatisticsOverview>("/statistics/overview"),
    staleTime: 20_000,
  });
}

export function useRoundFeed(stage?: string | null) {
  const query = stage ? `?stage=${encodeURIComponent(stage)}` : "";
  return useQuery({
    queryKey: [...apiKeys.roundFeed, stage ?? "current"],
    queryFn: () => apiGet<ApiRoundFeed>(`/statistics/round-feed${query}`),
    staleTime: 20_000,
  });
}

export function useUpdateMyCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMyCompanyPayload) => apiPatch<ApiUser>("/auth/me/company", payload),
    onSuccess: async (user) => {
      queryClient.setQueryData(apiKeys.me, user);
      await queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useUpdateMyPhone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMyPhonePayload) => apiPatch<ApiUser>("/auth/me/phone", payload),
    onSuccess: async (user) => {
      queryClient.setQueryData(apiKeys.me, user);
    },
  });
}

export function useUpdateMyNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMyNotificationPreferencesPayload) =>
      apiPatch<ApiUser>("/auth/me/notification-preferences", payload),
    onSuccess: async (user) => {
      queryClient.setQueryData(apiKeys.me, user);
    },
  });
}

export function useMyPredictions() {
  return useQuery({
    queryKey: apiKeys.myPredictions,
    queryFn: () => apiGet<ApiPrediction[]>("/predictions/mine"),
    enabled: Boolean(getAccessToken()),
    staleTime: 15_000,
    retry: false,
  });
}

export function useUpsertPrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertPredictionPayload) =>
      apiPut<ApiPrediction>("/predictions", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.myPredictions });
      await queryClient.invalidateQueries({ queryKey: apiKeys.individualRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => apiPost<ApiCompany>("/companies", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.companies });
      await queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: string; payload: UpdateCompanyPayload }) =>
      apiPatch<ApiCompany>(`/companies/${companyId}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.companies });
      await queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.users });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => apiPost<ApiTeam>("/teams", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.teams });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: UpdateTeamPayload }) =>
      apiPatch<ApiTeam>(`/teams/${teamId}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.teams });
      await queryClient.invalidateQueries({ queryKey: apiKeys.matches });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMatchPayload) => apiPost<ApiMatch>("/matches", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.matches });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: UpdateMatchPayload }) =>
      apiPatch<ApiMatch>(`/matches/${matchId}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.matches });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useUpdateMatchResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: UpdateMatchResultPayload }) =>
      apiPatch<ApiMatch>(`/matches/${matchId}/result`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.matches });
      await queryClient.invalidateQueries({ queryKey: apiKeys.individualRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useRecalculateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) =>
      apiPost<{ match_id: string; predictions_scored: number }>(
        `/matches/${matchId}/recalculate`,
        {},
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.matches });
      await queryClient.invalidateQueries({ queryKey: apiKeys.individualRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useSyncFixtures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SyncFixturesPayload) =>
      apiPost<ApiFixtureSyncResult>("/matches/sync-fixtures", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiKeys.matches }),
        queryClient.invalidateQueries({ queryKey: apiKeys.teams }),
        queryClient.invalidateQueries({ queryKey: apiKeys.individualRanking }),
        queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking }),
        queryClient.invalidateQueries({ queryKey: apiKeys.statistics }),
        queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents }),
      ]);
    },
  });
}

export function useSyncResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<ApiFixtureSyncResult>("/matches/sync-results", {}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: apiKeys.matches }),
        queryClient.invalidateQueries({ queryKey: apiKeys.myPredictions }),
        queryClient.invalidateQueries({ queryKey: apiKeys.individualRanking }),
        queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking }),
        queryClient.invalidateQueries({ queryKey: apiKeys.statistics }),
        queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents }),
      ]);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserPayload }) =>
      apiPatch<ApiUser>(`/users/${userId}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.users });
      await queryClient.invalidateQueries({ queryKey: apiKeys.individualRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.companyRanking });
      await queryClient.invalidateQueries({ queryKey: apiKeys.me });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useSendMatchReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) =>
      apiPost<{ sent: number; skipped_with_prediction: number }>(
        "/notifications/whatsapp/reminders",
        { match_id: matchId },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.notifications });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useSendUpcomingReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (minutesBefore: number) =>
      apiPost<{ matches_checked: number; sent: number }>(
        "/notifications/whatsapp/upcoming-reminders",
        { minutes_before: minutesBefore },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.notifications });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useSendMatchResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) =>
      apiPost<{ sent: number }>("/notifications/whatsapp/results", { match_id: matchId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.notifications });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useSendRanking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ sent: number }>("/notifications/whatsapp/ranking", {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: apiKeys.notifications });
      await queryClient.invalidateQueries({ queryKey: apiKeys.auditEvents });
    },
  });
}

export function useMatchAnalysis(matchId: string | null) {
  return useQuery({
    queryKey: matchId ? apiKeys.analysis(matchId) : ["analysis", "none"],
    queryFn: () => apiGet<ApiGameAnalysis>(`/analysis/matches/${matchId}`),
    enabled: Boolean(matchId && getAccessToken()),
    staleTime: 60_000,
    retry: false,
  });
}

export function useGenerateMatchAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, force = false }: { matchId: string; force?: boolean }) =>
      apiPost<ApiGameAnalysis>(`/analysis/matches/${matchId}?force=${force}`, {}),
    onSuccess: async (analysis) => {
      queryClient.setQueryData(apiKeys.analysis(analysis.match_id), analysis);
    },
  });
}
