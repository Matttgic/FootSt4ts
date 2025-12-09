import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import NodeCache from "node-cache";
import { API_LIMITS, CACHE_TTL_CONFIG } from "./apiConfig";

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

interface ApiUsageData {
  callsToday: number;
  lastReset: string;
}

const getToday = () => new Date().toISOString().split('T')[0];

const getApiUsage = (): ApiUsageData => {
  const today = getToday();
  let usage = cache.get<ApiUsageData>('api_usage');
  
  if (!usage || usage.lastReset !== today) {
    usage = { callsToday: 0, lastReset: today };
    cache.set('api_usage', usage);
  }
  
  return usage;
};

const incrementApiUsage = (): ApiUsageData => {
  const usage = getApiUsage();
  usage.callsToday++;
  cache.set('api_usage', usage);
  return usage;
};

const getCacheTTL = (endpoint: string): number => {
  if (endpoint.includes('topscorers') || endpoint.includes('topassists')) {
    return CACHE_TTL_CONFIG.TOP_SCORERS;
  }
  if (endpoint.includes('fixtures/players')) {
    return CACHE_TTL_CONFIG.FIXTURE_PLAYERS;
  }
  if (endpoint.includes('fixtures')) {
    return CACHE_TTL_CONFIG.FIXTURES;
  }
  if (endpoint.includes('players')) {
    return CACHE_TTL_CONFIG.PLAYER_STATS;
  }
  return CACHE_TTL_CONFIG.DEFAULT;
};

const fetchFromApiFootball = async (endpoint: string, params: Record<string, string> = {}): Promise<any> => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY is not configured');
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `https://v3.football.api-sports.io/${endpoint}${queryString ? `?${queryString}` : ''}`;
  const cacheKey = url;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const usage = getApiUsage();
  if (usage.callsToday >= API_LIMITS.DAILY_LIMIT) {
    throw new Error('API daily limit reached');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  incrementApiUsage();

  const ttl = getCacheTTL(endpoint);
  cache.set(cacheKey, data, ttl);

  return data;
};

const mergeTopScorersAndAssisters = (scorers: any[], assisters: any[]): any[] => {
  const playerMap = new Map<number, any>();

  for (const item of scorers) {
    const playerId = item.player.id;
    const stats = item.statistics[0] || {};
    
    playerMap.set(playerId, {
      playerId,
      playerName: item.player.name,
      playerPhoto: item.player.photo,
      teamId: stats.team?.id,
      teamName: stats.team?.name,
      teamLogo: stats.team?.logo,
      goals: stats.goals?.total || 0,
      assists: stats.goals?.assists || 0,
      matches: stats.games?.appearences || 0,
      minutes: stats.games?.minutes || 0,
      goalsPer90: 0,
      assistsPer90: 0,
    });
  }

  for (const item of assisters) {
    const playerId = item.player.id;
    const stats = item.statistics[0] || {};
    
    if (playerMap.has(playerId)) {
      const existing = playerMap.get(playerId);
      existing.assists = Math.max(existing.assists, stats.goals?.assists || 0);
    } else {
      playerMap.set(playerId, {
        playerId,
        playerName: item.player.name,
        playerPhoto: item.player.photo,
        teamId: stats.team?.id,
        teamName: stats.team?.name,
        teamLogo: stats.team?.logo,
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        matches: stats.games?.appearences || 0,
        minutes: stats.games?.minutes || 0,
        goalsPer90: 0,
        assistsPer90: 0,
      });
    }
  }

  const players = Array.from(playerMap.values());
  
  for (const player of players) {
    const minutesPlayed = player.minutes || 1;
    player.goalsPer90 = (player.goals / minutesPlayed) * 90;
    player.assistsPer90 = (player.assists / minutesPlayed) * 90;
  }

  return players.sort((a, b) => b.goals - a.goals);
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get('/api/football/usage', (_req: Request, res: Response) => {
    const usage = getApiUsage();
    const percentage = usage.callsToday / API_LIMITS.DAILY_LIMIT;
    
    let warningLevel: 'normal' | 'warning' | 'critical' = 'normal';
    if (percentage >= API_LIMITS.CRITICAL_THRESHOLD) {
      warningLevel = 'critical';
    } else if (percentage >= API_LIMITS.WARNING_THRESHOLD) {
      warningLevel = 'warning';
    }
    
    res.json({
      callsToday: usage.callsToday,
      limit: API_LIMITS.DAILY_LIMIT,
      percentage,
      warningLevel,
      lastReset: usage.lastReset,
    });
  });

  app.get('/api/football/stats/merged', async (req: Request, res: Response) => {
    try {
      const league = req.query.league as string || '39';
      const season = req.query.season as string || '2024';

      const [scorersData, assistersData] = await Promise.all([
        fetchFromApiFootball('players/topscorers', { league, season }),
        fetchFromApiFootball('players/topassists', { league, season }),
      ]);

      const merged = mergeTopScorersAndAssisters(
        scorersData.response || [],
        assistersData.response || []
      );

      res.json(merged);
    } catch (error: any) {
      console.error('Error fetching merged stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/players/search', async (req: Request, res: Response) => {
    try {
      const league = req.query.league as string || '39';
      const season = req.query.season as string || '2024';
      const search = req.query.search as string;

      if (!search || search.length < 3) {
        return res.json([]);
      }

      const data = await fetchFromApiFootball('players', { league, season, search });
      res.json(data.response || []);
    } catch (error: any) {
      console.error('Error searching players:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/players/form/:playerId', async (req: Request, res: Response) => {
    try {
      const playerId = req.params.playerId;
      const period = parseInt(req.query.period as string) || 5;

      const playerData = await fetchFromApiFootball('players', { id: playerId, season: '2024' });
      
      if (!playerData.response || playerData.response.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const player = playerData.response[0];
      const teamId = player.statistics[0]?.team?.id;
      
      if (!teamId) {
        return res.status(404).json({ error: 'Team not found for player' });
      }

      const fixturesData = await fetchFromApiFootball('fixtures', {
        team: teamId.toString(),
        season: '2024',
        last: period.toString(),
      });

      const fixtures = fixturesData.response || [];
      const lastNMatches: any[] = [];
      let totalGoals = 0;
      let totalAssists = 0;
      let totalRating = 0;
      let ratingCount = 0;
      let goalsLastN = 0;
      let assistsLastN = 0;

      for (const fix of fixtures) {
        try {
          const fixturePlayersData = await fetchFromApiFootball('fixtures/players', {
            fixture: fix.fixture.id.toString(),
          });

          const fixtureTeams = fixturePlayersData.response || [];
          let playerInFixture = null;
          
          for (const team of fixtureTeams) {
            const found = team.players?.find((p: any) => p.player.id === parseInt(playerId));
            if (found) {
              playerInFixture = found;
              break;
            }
          }

          if (playerInFixture) {
            const stats = playerInFixture.statistics[0] || {};
            const goals = stats.goals?.total || 0;
            const assists = stats.goals?.assists || 0;
            const minutes = stats.games?.minutes || 0;
            const rating = stats.games?.rating;

            const isHome = fix.teams.home.id === teamId;
            const opponent = isHome ? fix.teams.away : fix.teams.home;
            
            let result: 'W' | 'D' | 'L' = 'D';
            const homeGoals = fix.goals.home || 0;
            const awayGoals = fix.goals.away || 0;
            
            if (isHome) {
              result = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
            } else {
              result = awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D';
            }

            lastNMatches.push({
              fixtureId: fix.fixture.id,
              date: fix.fixture.date,
              opponent: opponent.name,
              opponentLogo: opponent.logo,
              isHome,
              goals,
              assists,
              minutes,
              rating,
              result,
            });

            totalGoals += goals;
            totalAssists += assists;
            goalsLastN += goals;
            assistsLastN += assists;
            
            if (rating) {
              totalRating += parseFloat(rating);
              ratingCount++;
            }
          }
        } catch (e) {
          console.error('Error fetching fixture players:', e);
        }
      }

      let currentStreak = { type: 'none' as 'goals' | 'assists' | 'clean' | 'none', count: 0 };
      
      for (const match of lastNMatches) {
        if (match.goals > 0) {
          if (currentStreak.type === 'goals' || currentStreak.type === 'none') {
            currentStreak = { type: 'goals', count: currentStreak.type === 'goals' ? currentStreak.count + 1 : 1 };
          } else {
            break;
          }
        } else if (match.assists > 0) {
          if (currentStreak.type === 'assists' || currentStreak.type === 'none') {
            currentStreak = { type: 'assists', count: currentStreak.type === 'assists' ? currentStreak.count + 1 : 1 };
          } else {
            break;
          }
        } else {
          break;
        }
      }

      res.json({
        playerId: parseInt(playerId),
        playerName: player.player.name,
        playerPhoto: player.player.photo,
        teamId,
        teamName: player.statistics[0]?.team?.name,
        teamLogo: player.statistics[0]?.team?.logo,
        lastNMatches,
        totalGoals,
        totalAssists,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        goalsLastN,
        assistsLastN,
        currentStreak,
      });
    } catch (error: any) {
      console.error('Error fetching player form:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/players/stats/:playerId', async (req: Request, res: Response) => {
    try {
      const playerId = req.params.playerId;
      const league = req.query.league as string || '39';
      const season = req.query.season as string || '2024';

      const data = await fetchFromApiFootball('players', { id: playerId, league, season });
      
      if (!data.response || data.response.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const player = data.response[0];
      const stats = player.statistics[0] || {};
      const minutes = stats.games?.minutes || 1;

      res.json({
        playerId: player.player.id,
        playerName: player.player.name,
        playerPhoto: player.player.photo,
        teamId: stats.team?.id,
        teamName: stats.team?.name,
        teamLogo: stats.team?.logo,
        goals: stats.goals?.total || 0,
        assists: stats.goals?.assists || 0,
        matches: stats.games?.appearences || 0,
        minutes,
        goalsPer90: ((stats.goals?.total || 0) / minutes) * 90,
        assistsPer90: ((stats.goals?.assists || 0) / minutes) * 90,
      });
    } catch (error: any) {
      console.error('Error fetching player stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/fixtures/date', async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const league = req.query.league as string || '39';
      const season = req.query.season as string || '2024';

      const usage = getApiUsage();
      const percentage = usage.callsToday / API_LIMITS.DAILY_LIMIT;
      
      if (percentage >= API_LIMITS.CRITICAL_THRESHOLD) {
        return res.status(429).json({ error: 'API limit reached', warningLevel: 'critical' });
      }

      const fixturesData = await fetchFromApiFootball('fixtures', { date, league, season });
      const fixtures = fixturesData.response || [];

      const [scorersData, assistersData] = await Promise.all([
        fetchFromApiFootball('players/topscorers', { league, season }),
        fetchFromApiFootball('players/topassists', { league, season }),
      ]);

      const topScorers = scorersData.response?.slice(0, 20) || [];
      const topAssisters = assistersData.response?.slice(0, 20) || [];

      const matchesWithPlayers = fixtures.map((fixture: any) => {
        const homeTeamId = fixture.teams.home.id;
        const awayTeamId = fixture.teams.away.id;

        const homeScorers = topScorers
          .filter((p: any) => p.statistics[0]?.team?.id === homeTeamId)
          .slice(0, 3)
          .map((p: any) => ({
            playerId: p.player.id,
            playerName: p.player.name,
            playerPhoto: p.player.photo,
            teamName: p.statistics[0]?.team?.name,
            scoreProb: calculateSimpleScoreProb(p),
            assistProb: calculateSimpleAssistProb(p),
            dataQuality: hassufficientData(p) ? 'sufficient' : 'insufficient',
          }));

        const awayScorers = topScorers
          .filter((p: any) => p.statistics[0]?.team?.id === awayTeamId)
          .slice(0, 3)
          .map((p: any) => ({
            playerId: p.player.id,
            playerName: p.player.name,
            playerPhoto: p.player.photo,
            teamName: p.statistics[0]?.team?.name,
            scoreProb: calculateSimpleScoreProb(p),
            assistProb: calculateSimpleAssistProb(p),
            dataQuality: hassufficientData(p) ? 'sufficient' : 'insufficient',
          }));

        const homeAssisters = topAssisters
          .filter((p: any) => p.statistics[0]?.team?.id === homeTeamId)
          .slice(0, 3)
          .map((p: any) => ({
            playerId: p.player.id,
            playerName: p.player.name,
            playerPhoto: p.player.photo,
            teamName: p.statistics[0]?.team?.name,
            scoreProb: calculateSimpleScoreProb(p),
            assistProb: calculateSimpleAssistProb(p),
            dataQuality: hassufficientData(p) ? 'sufficient' : 'insufficient',
          }));

        const awayAssisters = topAssisters
          .filter((p: any) => p.statistics[0]?.team?.id === awayTeamId)
          .slice(0, 3)
          .map((p: any) => ({
            playerId: p.player.id,
            playerName: p.player.name,
            playerPhoto: p.player.photo,
            teamName: p.statistics[0]?.team?.name,
            scoreProb: calculateSimpleScoreProb(p),
            assistProb: calculateSimpleAssistProb(p),
            dataQuality: hassufficientData(p) ? 'sufficient' : 'insufficient',
          }));

        return {
          fixture,
          topScorers: [...homeScorers, ...awayScorers],
          topAssisters: [...homeAssisters, ...awayAssisters],
          inFormPlayers: [...homeScorers, ...awayScorers].slice(0, 3),
        };
      });

      res.json(matchesWithPlayers);
    } catch (error: any) {
      console.error('Error fetching fixtures:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

function calculateSimpleScoreProb(player: any): number {
  const stats = player.statistics[0] || {};
  const goals = stats.goals?.total || 0;
  const minutes = stats.games?.minutes || 1;
  const goalsPer90 = (goals / minutes) * 90;
  
  const teamAttackFactor = 0.5;
  const opponentDefenseWeakness = 0.5;
  const goalsLastN = goals / Math.max(1, stats.games?.appearences || 1) * 5;
  
  const prob = 
    0.4 * goalsPer90 + 
    0.3 * (goalsLastN / 5) + 
    0.2 * teamAttackFactor + 
    0.1 * opponentDefenseWeakness;
  
  return Math.max(0, Math.min(1, prob));
}

function calculateSimpleAssistProb(player: any): number {
  const stats = player.statistics[0] || {};
  const assists = stats.goals?.assists || 0;
  const minutes = stats.games?.minutes || 1;
  const assistsPer90 = (assists / minutes) * 90;
  
  const teamAttackFactor = 0.5;
  const assistsLastN = assists / Math.max(1, stats.games?.appearences || 1) * 5;
  
  const prob = 
    0.5 * assistsPer90 + 
    0.3 * (assistsLastN / 5) + 
    0.2 * teamAttackFactor;
  
  return Math.max(0, Math.min(1, prob));
}

function hassufficientData(player: any): boolean {
  const stats = player.statistics[0] || {};
  const minutes = stats.games?.minutes || 0;
  const matches = stats.games?.appearences || 0;
  return minutes >= 270 && matches >= 3;
}
