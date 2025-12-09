import type { Competition } from "@shared/schema";

export const TIER_1_COMPETITIONS: Competition[] = [
  { id: 39, name: "Premier League", country: "England", logo: "https://media.api-sports.io/football/leagues/39.png", tier: 1, defaultSeason: 2024 },
  { id: 140, name: "La Liga", country: "Spain", logo: "https://media.api-sports.io/football/leagues/140.png", tier: 1, defaultSeason: 2024 },
  { id: 135, name: "Serie A", country: "Italy", logo: "https://media.api-sports.io/football/leagues/135.png", tier: 1, defaultSeason: 2024 },
  { id: 78, name: "Bundesliga", country: "Germany", logo: "https://media.api-sports.io/football/leagues/78.png", tier: 1, defaultSeason: 2024 },
  { id: 61, name: "Ligue 1", country: "France", logo: "https://media.api-sports.io/football/leagues/61.png", tier: 1, defaultSeason: 2024 },
  { id: 2, name: "UEFA Champions League", country: "World", logo: "https://media.api-sports.io/football/leagues/2.png", tier: 1, defaultSeason: 2024 },
  { id: 3, name: "UEFA Europa League", country: "World", logo: "https://media.api-sports.io/football/leagues/3.png", tier: 1, defaultSeason: 2024 },
];

export const TIER_2_COMPETITIONS: Competition[] = [
  { id: 94, name: "Primeira Liga", country: "Portugal", logo: "https://media.api-sports.io/football/leagues/94.png", tier: 2, defaultSeason: 2024 },
  { id: 88, name: "Eredivisie", country: "Netherlands", logo: "https://media.api-sports.io/football/leagues/88.png", tier: 2, defaultSeason: 2024 },
  { id: 144, name: "Jupiler Pro League", country: "Belgium", logo: "https://media.api-sports.io/football/leagues/144.png", tier: 2, defaultSeason: 2024 },
  { id: 203, name: "Super Lig", country: "Turkey", logo: "https://media.api-sports.io/football/leagues/203.png", tier: 2, defaultSeason: 2024 },
  { id: 197, name: "Super League", country: "Greece", logo: "https://media.api-sports.io/football/leagues/197.png", tier: 2, defaultSeason: 2024 },
  { id: 179, name: "Premiership", country: "Scotland", logo: "https://media.api-sports.io/football/leagues/179.png", tier: 2, defaultSeason: 2024 },
  { id: 253, name: "Major League Soccer", country: "USA", logo: "https://media.api-sports.io/football/leagues/253.png", tier: 2, defaultSeason: 2024 },
  { id: 71, name: "Serie A", country: "Brazil", logo: "https://media.api-sports.io/football/leagues/71.png", tier: 2, defaultSeason: 2024 },
  { id: 128, name: "Liga Profesional Argentina", country: "Argentina", logo: "https://media.api-sports.io/football/leagues/128.png", tier: 2, defaultSeason: 2024 },
];

export const ALL_COMPETITIONS = [...TIER_1_COMPETITIONS, ...TIER_2_COMPETITIONS];

export const getCompetitionById = (id: number): Competition | undefined => {
  return ALL_COMPETITIONS.find(c => c.id === id);
};

export const getAvailableSeasons = (): number[] => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
};
