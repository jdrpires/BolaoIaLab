export type Team = { id: string; name: string; short: string; color: string; logo: string };

export const teams: Team[] = [
  { id: "onv", name: "Onovolab United", short: "ONV", color: "#a855f7", logo: "🟣" },
  { id: "ais", name: "AI Hub Stars", short: "AIH", color: "#22d3ee", logo: "🤖" },
  { id: "cs", name: "Code Synergy FC", short: "CSY", color: "#ec4899", logo: "💻" },
  { id: "qb", name: "QuantumByte", short: "QBT", color: "#10b981", logo: "⚛️" },
  { id: "nv", name: "NovaVentures", short: "NVT", color: "#f59e0b", logo: "🚀" },
  { id: "bx", name: "ByteBox", short: "BBX", color: "#3b82f6", logo: "📦" },
  { id: "dt", name: "DataTribe", short: "DTR", color: "#ef4444", logo: "📊" },
  { id: "nb", name: "Neon Builders", short: "NEO", color: "#8b5cf6", logo: "⚡" },
];

export type Match = {
  id: string;
  home: Team;
  away: Team;
  date: string;
  time: string;
  stage: string;
  status: "upcoming" | "live" | "finished";
  result?: { home: number; away: number };
};

const t = (id: string) => teams.find((x) => x.id === id)!;

export const matches: Match[] = [
  {
    id: "m1",
    home: t("onv"),
    away: t("ais"),
    date: "15 Mar",
    time: "19:00",
    stage: "Fase de Grupos",
    status: "upcoming",
  },
  {
    id: "m2",
    home: t("cs"),
    away: t("qb"),
    date: "15 Mar",
    time: "21:00",
    stage: "Fase de Grupos",
    status: "upcoming",
  },
  {
    id: "m3",
    home: t("nv"),
    away: t("bx"),
    date: "16 Mar",
    time: "19:00",
    stage: "Fase de Grupos",
    status: "upcoming",
  },
  {
    id: "m4",
    home: t("dt"),
    away: t("nb"),
    date: "16 Mar",
    time: "21:00",
    stage: "Fase de Grupos",
    status: "upcoming",
  },
  {
    id: "m5",
    home: t("onv"),
    away: t("cs"),
    date: "18 Mar",
    time: "20:00",
    stage: "Fase de Grupos",
    status: "upcoming",
  },
  {
    id: "m6",
    home: t("ais"),
    away: t("qb"),
    date: "18 Mar",
    time: "22:00",
    stage: "Fase de Grupos",
    status: "upcoming",
  },
];

export const lastResults: Match[] = [
  {
    id: "r1",
    home: t("onv"),
    away: t("dt"),
    date: "12 Mar",
    time: "20:00",
    stage: "Grupos",
    status: "finished",
    result: { home: 3, away: 1 },
  },
  {
    id: "r2",
    home: t("nb"),
    away: t("ais"),
    date: "12 Mar",
    time: "22:00",
    stage: "Grupos",
    status: "finished",
    result: { home: 2, away: 2 },
  },
  {
    id: "r3",
    home: t("bx"),
    away: t("cs"),
    date: "11 Mar",
    time: "19:30",
    stage: "Grupos",
    status: "finished",
    result: { home: 0, away: 2 },
  },
  {
    id: "r4",
    home: t("qb"),
    away: t("nv"),
    date: "11 Mar",
    time: "21:30",
    stage: "Grupos",
    status: "finished",
    result: { home: 4, away: 2 },
  },
];

export type Player = {
  rank: number;
  name: string;
  company: string;
  avatar: string;
  points: number;
  trend: number;
  hits: number;
};

export const ranking: Player[] = [
  {
    rank: 1,
    name: "Mariana Costa",
    company: "Code Synergy",
    avatar: "MC",
    points: 248,
    trend: 2,
    hits: 14,
  },
  {
    rank: 2,
    name: "Rafael Mendes",
    company: "AI Hub",
    avatar: "RM",
    points: 236,
    trend: 0,
    hits: 13,
  },
  {
    rank: 3,
    name: "Juliana Prado",
    company: "Onovolab",
    avatar: "JP",
    points: 224,
    trend: 4,
    hits: 12,
  },
  {
    rank: 4,
    name: "Carlos Henrique",
    company: "QuantumByte",
    avatar: "CH",
    points: 218,
    trend: -1,
    hits: 12,
  },
  {
    rank: 5,
    name: "Beatriz Almeida",
    company: "NovaVentures",
    avatar: "BA",
    points: 210,
    trend: 1,
    hits: 11,
  },
  {
    rank: 6,
    name: "Diego Ramos",
    company: "Code Synergy",
    avatar: "DR",
    points: 198,
    trend: -2,
    hits: 11,
  },
  {
    rank: 7,
    name: "Fernanda Lima",
    company: "DataTribe",
    avatar: "FL",
    points: 186,
    trend: 3,
    hits: 10,
  },
  {
    rank: 8,
    name: "Pedro Tavares",
    company: "AI Hub",
    avatar: "PT",
    points: 178,
    trend: 0,
    hits: 10,
  },
  {
    rank: 9,
    name: "Aline Souza",
    company: "ByteBox",
    avatar: "AS",
    points: 170,
    trend: -1,
    hits: 9,
  },
  {
    rank: 10,
    name: "Vinícius Rocha",
    company: "Onovolab",
    avatar: "VR",
    points: 162,
    trend: 1,
    hits: 9,
  },
];

export type CompanyRank = {
  rank: number;
  name: string;
  participants: number;
  totalPoints: number;
  avgPoints: number;
  color: string;
};

export const companyRanking: CompanyRank[] = [
  {
    rank: 1,
    name: "Code Synergy",
    participants: 18,
    totalPoints: 3210,
    avgPoints: 178,
    color: "#ec4899",
  },
  {
    rank: 2,
    name: "AI Hub",
    participants: 22,
    totalPoints: 3084,
    avgPoints: 140,
    color: "#22d3ee",
  },
  {
    rank: 3,
    name: "Onovolab",
    participants: 26,
    totalPoints: 2980,
    avgPoints: 114,
    color: "#a855f7",
  },
  {
    rank: 4,
    name: "QuantumByte",
    participants: 14,
    totalPoints: 2150,
    avgPoints: 153,
    color: "#10b981",
  },
  {
    rank: 5,
    name: "NovaVentures",
    participants: 12,
    totalPoints: 1820,
    avgPoints: 151,
    color: "#f59e0b",
  },
  {
    rank: 6,
    name: "DataTribe",
    participants: 10,
    totalPoints: 1480,
    avgPoints: 148,
    color: "#ef4444",
  },
  {
    rank: 7,
    name: "ByteBox",
    participants: 9,
    totalPoints: 1290,
    avgPoints: 143,
    color: "#3b82f6",
  },
  {
    rank: 8,
    name: "Neon Builders",
    participants: 8,
    totalPoints: 1112,
    avgPoints: 139,
    color: "#8b5cf6",
  },
];

export const stats = {
  participants: 119,
  companies: 8,
  matchesBet: 1742,
  predictionsMade: 4886,
  iaQueries: 2103,
  accuracy: 64,
};

export const popularScores = [
  { score: "2 x 1", count: 412 },
  { score: "1 x 0", count: 356 },
  { score: "2 x 2", count: 298 },
  { score: "3 x 1", count: 244 },
  { score: "1 x 1", count: 218 },
  { score: "3 x 2", count: 187 },
];

export const weeklyActivity = [
  { day: "Seg", palpites: 120, ia: 60 },
  { day: "Ter", palpites: 180, ia: 95 },
  { day: "Qua", palpites: 240, ia: 130 },
  { day: "Qui", palpites: 200, ia: 110 },
  { day: "Sex", palpites: 320, ia: 180 },
  { day: "Sáb", palpites: 410, ia: 240 },
  { day: "Dom", palpites: 380, ia: 220 },
];

export const evolutionData = [
  { round: "R1", Mariana: 24, Rafael: 22, Juliana: 18, Carlos: 20, Beatriz: 16 },
  { round: "R2", Mariana: 52, Rafael: 46, Juliana: 42, Carlos: 44, Beatriz: 38 },
  { round: "R3", Mariana: 88, Rafael: 78, Juliana: 72, Carlos: 80, Beatriz: 66 },
  { round: "R4", Mariana: 138, Rafael: 124, Juliana: 118, Carlos: 132, Beatriz: 108 },
  { round: "R5", Mariana: 192, Rafael: 180, Juliana: 168, Carlos: 174, Beatriz: 156 },
  { round: "R6", Mariana: 248, Rafael: 236, Juliana: 224, Carlos: 218, Beatriz: 210 },
];
