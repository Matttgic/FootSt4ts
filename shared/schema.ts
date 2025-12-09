import { z } from "zod";

// API Football Types
export const PlayerSchema = z.object({
  id: z.number(),
  name: z.string(),
  firstname: z.string().nullable(),
  lastname: z.string().nullable(),
  age: z.number().nullable(),
  nationality: z.string().nullable(),
  height: z.string().nullable(),
  weight: z.string().nullable(),
  injured: z.boolean().nullable(),
  photo: z.string().nullable(),
});

export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().nullable(),
});

export const LeagueSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string().nullable(),
  logo: z.string().nullable(),
  flag: z.string().nullable(),
  season: z.number(),
});

export const GoalsSchema = z.object({
  total: z.number().nullable(),
  conceded: z.number().nullable(),
  assists: z.number().nullable(),
  saves: z.number().nullable(),
});

export const GamesSchema = z.object({
  appearences: z.number().nullable(),
  lineups: z.number().nullable(),
  minutes: z.number().nullable(),
  number: z.number().nullable(),
  position: z.string().nullable(),
  rating: z.string().nullable(),
  captain: z.boolean().nullable(),
});

export const PlayerStatisticsSchema = z.object({
  player: PlayerSchema,
  statistics: z.array(z.object({
    team: TeamSchema,
    league: LeagueSchema.optional(),
    games: GamesSchema.optional(),
    goals: GoalsSchema.optional(),
  })),
});

export const FixtureTeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().nullable(),
  winner: z.boolean().nullable().optional(),
});

export const FixtureSchema = z.object({
  fixture: z.object({
    id: z.number(),
    referee: z.string().nullable(),
    timezone: z.string(),
    date: z.string(),
    timestamp: z.number(),
    venue: z.object({
      id: z.number().nullable(),
      name: z.string().nullable(),
      city: z.string().nullable(),
    }).optional(),
    status: z.object({
      long: z.string(),
      short: z.string(),
      elapsed: z.number().nullable(),
    }),
  }),
  league: z.object({
    id: z.number(),
    name: z.string(),
    country: z.string(),
    logo: z.string().nullable(),
    flag: z.string().nullable(),
    season: z.number(),
    round: z.string().nullable(),
  }),
  teams: z.object({
    home: FixtureTeamSchema,
    away: FixtureTeamSchema,
  }),
  goals: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
  score: z.object({
    halftime: z.object({
      home: z.number().nullable(),
      away: z.number().nullable(),
    }),
    fulltime: z.object({
      home: z.number().nullable(),
      away: z.number().nullable(),
    }),
    extratime: z.object({
      home: z.number().nullable(),
      away: z.number().nullable(),
    }).nullable(),
    penalty: z.object({
      home: z.number().nullable(),
      away: z.number().nullable(),
    }).nullable(),
  }).optional(),
});

// Application Types
export interface MergedPlayerStats {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  goals: number;
  assists: number;
  matches: number;
  minutes: number;
  goalsPer90: number;
  assistsPer90: number;
}

export interface PlayerFormData {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  lastNMatches: MatchPerformance[];
  totalGoals: number;
  totalAssists: number;
  avgRating: number;
  goalsLastN: number;
  assistsLastN: number;
  currentStreak: {
    type: 'goals' | 'assists' | 'clean' | 'none';
    count: number;
  };
}

export interface MatchPerformance {
  fixtureId: number;
  date: string;
  opponent: string;
  opponentLogo: string | null;
  isHome: boolean;
  goals: number;
  assists: number;
  minutes: number;
  rating: string | null;
  result: 'W' | 'D' | 'L';
}

export interface PlayerProbability {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  teamName: string;
  scoreProb: number;
  assistProb: number;
  dataQuality: 'sufficient' | 'insufficient';
  factors?: {
    goalsPer90: number;
    assistsPer90: number;
    goalsLastN: number;
    assistsLastN: number;
    teamAttackFactor: number;
    opponentDefenseWeakness: number;
    homeBoost: number;
  };
}

export interface MatchWithPlayers {
  fixture: z.infer<typeof FixtureSchema>;
  topScorers: PlayerProbability[];
  topAssisters: PlayerProbability[];
  inFormPlayers: PlayerProbability[];
}

export interface Competition {
  id: number;
  name: string;
  country: string;
  logo: string;
  tier: 1 | 2;
  defaultSeason: number;
}

export interface ApiUsage {
  callsToday: number;
  limit: number;
  percentage: number;
  warningLevel: 'normal' | 'warning' | 'critical';
  lastReset: string;
}

export interface Favorite {
  type: 'player' | 'team';
  id: number;
  name: string;
  logo?: string | null;
}

export type Language = 'en' | 'fr';
export type Theme = 'light' | 'dark';

export type Player = z.infer<typeof PlayerSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type League = z.infer<typeof LeagueSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
export type PlayerStatistics = z.infer<typeof PlayerStatisticsSchema>;
