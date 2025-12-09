import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import NodeCache from "node-cache";
import { API_LIMITS, CACHE_TTL_CONFIG } from "./apiConfig";

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

interface ApiUsageData {
  callsToday: number;
  lastReset: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
  details?: any;
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
  if (endpoint.includes('leagues')) {
    return CACHE_TTL_CONFIG.DEFAULT;
  }
  if (endpoint.includes('players')) {
    return CACHE_TTL_CONFIG.PLAYER_STATS;
  }
  return CACHE_TTL_CONFIG.DEFAULT;
};

const fetchFromApiFootball = async (endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<any>> => {
  const apiKey = process.env.API_FOOTBALL_KEY;
  
  if (!apiKey) {
    console.error('[API] API_FOOTBALL_KEY is not configured');
    return { error: 'API_FOOTBALL_KEY is not configured', status: 500 };
  }

  const queryString = new URLSearchParams(params).toString();
  const url = `https://v3.football.api-sports.io/${endpoint}${queryString ? `?${queryString}` : ''}`;
  const cacheKey = url;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`[API] Cache hit for: ${endpoint}`);
    return { data: cachedData };
  }

  const usage = getApiUsage();
  if (usage.callsToday >= API_LIMITS.DAILY_LIMIT) {
    console.error('[API] Daily limit reached');
    return { error: 'API daily limit reached', status: 429 };
  }

  try {
    console.log(`[API] Fetching: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`[API] HTTP Error ${response.status}:`, data);
      return { 
        error: `API request failed with status ${response.status}`, 
        status: response.status,
        details: data
      };
    }

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('[API] API returned errors:', data.errors);
      return { 
        error: 'API returned errors', 
        status: 400,
        details: data.errors
      };
    }

    incrementApiUsage();
    console.log(`[API] Success: ${endpoint}, results: ${data.results || 0}`);

    const ttl = getCacheTTL(endpoint);
    cache.set(cacheKey, data, ttl);

    return { data };
  } catch (error: any) {
    console.error(`[API] Fetch error for ${endpoint}:`, error.message);
    return { error: error.message, status: 500 };
  }
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

  app.get('/api/football/leagues', async (req: Request, res: Response) => {
    try {
      const leagueId = req.query.id as string;
      
      const params: Record<string, string> = {};
      if (leagueId) {
        params.id = leagueId;
      }
      
      const result = await fetchFromApiFootball('leagues', params);
      
      if (result.error) {
        console.error('[/api/football/leagues] Error:', result.error, result.details);
        return res.status(result.status || 500).json({ 
          error: result.error, 
          details: result.details 
        });
      }
      
      const leagues = result.data?.response || [];
      
      const processed = leagues.map((item: any) => ({
        id: item.league.id,
        name: item.league.name,
        country: item.country.name,
        logo: item.league.logo,
        seasons: item.seasons.map((s: any) => ({
          year: s.year,
          start: s.start,
          end: s.end,
          current: s.current,
        })),
        currentSeason: item.seasons.find((s: any) => s.current)?.year || 
                       item.seasons[item.seasons.length - 1]?.year,
      }));
      
      res.json(processed);
    } catch (error: any) {
      console.error('[/api/football/leagues] Exception:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/stats/merged', async (req: Request, res: Response) => {
    try {
      const league = req.query.league as string;
      const season = req.query.season as string;

      if (!league || !season) {
        return res.status(400).json({ 
          error: 'Missing required parameters: league and season',
          receivedParams: { league, season }
        });
      }

      console.log(`[/api/football/stats/merged] Fetching for league=${league}, season=${season}`);

      const [scorersResult, assistersResult] = await Promise.all([
        fetchFromApiFootball('players/topscorers', { league, season }),
        fetchFromApiFootball('players/topassists', { league, season }),
      ]);

      if (scorersResult.error && assistersResult.error) {
        console.error('[/api/football/stats/merged] Both requests failed');
        return res.status(scorersResult.status || 500).json({ 
          error: `Failed to fetch data: ${scorersResult.error}`,
          scorersError: scorersResult.error,
          assistersError: assistersResult.error,
          details: scorersResult.details || assistersResult.details
        });
      }

      const scorers = scorersResult.data?.response || [];
      const assisters = assistersResult.data?.response || [];

      console.log(`[/api/football/stats/merged] Found ${scorers.length} scorers, ${assisters.length} assisters`);

      if (scorers.length === 0 && assisters.length === 0) {
        return res.json({ 
          data: [],
          meta: {
            league,
            season,
            scorersCount: 0,
            assistersCount: 0,
            message: 'No data available for this league/season combination'
          }
        });
      }

      const merged = mergeTopScorersAndAssisters(scorers, assisters);

      res.json({ 
        data: merged,
        meta: {
          league,
          season,
          scorersCount: scorers.length,
          assistersCount: assisters.length
        }
      });
    } catch (error: any) {
      console.error('[/api/football/stats/merged] Exception:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/players/search', async (req: Request, res: Response) => {
    try {
      const league = req.query.league as string;
      const season = req.query.season as string;
      const search = req.query.search as string;

      if (!search || search.length < 3) {
        return res.json([]);
      }

      if (!league || !season) {
        return res.status(400).json({ error: 'Missing required parameters: league and season' });
      }

      const result = await fetchFromApiFootball('players', { league, season, search });
      
      if (result.error) {
        return res.status(result.status || 500).json({ error: result.error, details: result.details });
      }
      
      res.json(result.data?.response || []);
    } catch (error: any) {
      console.error('[/api/football/players/search] Exception:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/players/form/:playerId', async (req: Request, res: Response) => {
    try {
      const playerId = req.params.playerId;
      const period = parseInt(req.query.period as string) || 5;
      const season = req.query.season as string;

      if (!season) {
        return res.status(400).json({ error: 'Missing required parameter: season' });
      }

      const playerResult = await fetchFromApiFootball('players', { id: playerId, season });
      
      if (playerResult.error) {
        return res.status(playerResult.status || 500).json({ error: playerResult.error, details: playerResult.details });
      }
      
      if (!playerResult.data?.response || playerResult.data.response.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const player = playerResult.data.response[0];
      const teamId = player.statistics[0]?.team?.id;
      
      if (!teamId) {
        return res.status(404).json({ error: 'Team not found for player' });
      }

      const fixturesResult = await fetchFromApiFootball('fixtures', {
        team: teamId.toString(),
        season,
        last: period.toString(),
      });

      if (fixturesResult.error) {
        return res.status(fixturesResult.status || 500).json({ error: fixturesResult.error, details: fixturesResult.details });
      }

      const fixtures = fixturesResult.data?.response || [];
      const lastNMatches: any[] = [];
      let totalGoals = 0;
      let totalAssists = 0;
      let totalRating = 0;
      let ratingCount = 0;
      let goalsLastN = 0;
      let assistsLastN = 0;

      for (const fix of fixtures) {
        try {
          const fixturePlayersResult = await fetchFromApiFootball('fixtures/players', {
            fixture: fix.fixture.id.toString(),
          });

          if (fixturePlayersResult.error) continue;

          const fixtureTeams = fixturePlayersResult.data?.response || [];
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
          console.error('[/api/football/players/form] Error fetching fixture players:', e);
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
      console.error('[/api/football/players/form] Exception:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/players/stats/:playerId', async (req: Request, res: Response) => {
    try {
      const playerId = req.params.playerId;
      const league = req.query.league as string;
      const season = req.query.season as string;

      if (!league || !season) {
        return res.status(400).json({ error: 'Missing required parameters: league and season' });
      }

      const result = await fetchFromApiFootball('players', { id: playerId, league, season });
      
      if (result.error) {
        return res.status(result.status || 500).json({ error: result.error, details: result.details });
      }
      
      if (!result.data?.response || result.data.response.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const player = result.data.response[0];
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
      console.error('[/api/football/players/stats] Exception:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/fixtures/date', async (req: Request, res: Response) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const league = req.query.league as string;
      const season = req.query.season as string;

      if (!league || !season) {
        return res.status(400).json({ error: 'Missing required parameters: league and season' });
      }

      const usage = getApiUsage();
      const percentage = usage.callsToday / API_LIMITS.DAILY_LIMIT;
      
      if (percentage >= API_LIMITS.CRITICAL_THRESHOLD) {
        return res.status(429).json({ error: 'API limit reached', warningLevel: 'critical' });
      }

      console.log(`[/api/football/fixtures/date] Fetching for date=${date}, league=${league}, season=${season}`);

      const fixturesResult = await fetchFromApiFootball('fixtures', { date, league, season });
      
      if (fixturesResult.error) {
        return res.status(fixturesResult.status || 500).json({ error: fixturesResult.error, details: fixturesResult.details });
      }
      
      const fixtures = fixturesResult.data?.response || [];

      const [scorersResult, assistersResult] = await Promise.all([
        fetchFromApiFootball('players/topscorers', { league, season }),
        fetchFromApiFootball('players/topassists', { league, season }),
      ]);

      const topScorers = scorersResult.data?.response?.slice(0, 20) || [];
      const topAssisters = assistersResult.data?.response?.slice(0, 20) || [];

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
      console.error('[/api/football/fixtures/date] Exception:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/football/players/top-form', async (req: Request, res: Response) => {
    try {
      const league = req.query.league as string;
      const season = req.query.season as string;
      const period = parseInt(req.query.period as string) || 5;
      const n = period === 10 ? 10 : 5;

      if (!league || !season) {
        return res.status(400).json({ error: 'Missing required parameters: league and season' });
      }

      const cacheKey = `top-form-${league}-${season}-${n}`;
      const cachedData = cache.get(cacheKey) as { players: any[]; isSeasonFallback: boolean; period: number } | undefined;
      if (cachedData) {
        console.log('[/api/football/players/top-form] Cache hit');
        return res.json(cachedData);
      }

      console.log(`[/api/football/players/top-form] Fetching for league=${league}, season=${season}, period=${n}`);

      const [scorersResult, assistersResult] = await Promise.all([
        fetchFromApiFootball('players/topscorers', { league, season }),
        fetchFromApiFootball('players/topassists', { league, season }),
      ]);

      if (scorersResult.error && assistersResult.error) {
        return res.status(scorersResult.status || 500).json({ 
          error: 'Failed to fetch top players data',
        });
      }

      const scorers = scorersResult.data?.response || [];
      const assisters = assistersResult.data?.response || [];
      
      const candidatePlayers: Array<{
        playerId: number;
        playerName: string;
        playerPhoto: string;
        teamId: number;
        teamName: string;
        teamLogo: string;
        seasonGoals: number;
        seasonAssists: number;
        seasonMatches: number;
        seasonMinutes: number;
      }> = [];
      
      const seenIds = new Set<number>();
      
      for (const item of [...scorers.slice(0, 15), ...assisters.slice(0, 15)]) {
        if (seenIds.has(item.player.id)) continue;
        seenIds.add(item.player.id);
        
        const stats = item.statistics[0] || {};
        candidatePlayers.push({
          playerId: item.player.id,
          playerName: item.player.name,
          playerPhoto: item.player.photo,
          teamId: stats.team?.id,
          teamName: stats.team?.name,
          teamLogo: stats.team?.logo,
          seasonGoals: stats.goals?.total || 0,
          seasonAssists: stats.goals?.assists || 0,
          seasonMatches: stats.games?.appearences || 0,
          seasonMinutes: stats.games?.minutes || 0,
        });
      }
      
      let topPlayers: any[] = [];
      let isSeasonFallback = false;
      
      if (candidatePlayers.length > 0) {
        const topCandidates = candidatePlayers
          .filter(p => p.seasonMatches > 0)
          .sort((a, b) => {
            const aPer90 = a.seasonMinutes > 0 ? ((a.seasonGoals + a.seasonAssists) / a.seasonMinutes) * 90 : 0;
            const bPer90 = b.seasonMinutes > 0 ? ((b.seasonGoals + b.seasonAssists) / b.seasonMinutes) * 90 : 0;
            return bPer90 - aPer90;
          })
          .slice(0, 10);
        
        const playersWithRealForm: any[] = [];
        
        for (const player of topCandidates) {
          const playerFormCacheKey = `player-form-real-${player.playerId}-${league}-${season}-${n}`;
          let cachedForm = cache.get(playerFormCacheKey) as any;
          
          if (cachedForm) {
            playersWithRealForm.push(cachedForm);
            continue;
          }
          
          try {
            const teamFixturesCacheKey = `team-fixtures-${player.teamId}-${season}`;
            let teamFixtures = cache.get(teamFixturesCacheKey) as any[];
            
            if (!teamFixtures) {
              const teamFixResult = await fetchFromApiFootball('fixtures', {
                team: player.teamId.toString(),
                season,
                last: '15',
              });
              teamFixtures = teamFixResult.data?.response || [];
              cache.set(teamFixturesCacheKey, teamFixtures, 3600);
            }
            
            const finishedFixtures = teamFixtures
              .filter((f: any) => f.fixture?.status?.short === 'FT')
              .sort((a: any, b: any) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
              .slice(0, n);
            
            if (finishedFixtures.length >= Math.min(n, 3)) {
              let goalsLastN = 0;
              let assistsLastN = 0;
              let minutesLastN = 0;
              let decisiveMatches = 0;
              let matchesAnalyzed = 0;
              
              for (const fix of finishedFixtures) {
                const fixturePlayersCacheKey = `fixture-players-${fix.fixture.id}`;
                let fixturePlayers = cache.get(fixturePlayersCacheKey) as any[];
                
                if (!fixturePlayers) {
                  const fpResult = await fetchFromApiFootball('fixtures/players', {
                    fixture: fix.fixture.id.toString(),
                  });
                  fixturePlayers = fpResult.data?.response || [];
                  cache.set(fixturePlayersCacheKey, fixturePlayers, 86400);
                }
                
                let playerFound = false;
                for (const team of fixturePlayers) {
                  const playerStats = team.players?.find((p: any) => p.player?.id === player.playerId);
                  if (playerStats) {
                    playerFound = true;
                    const stats = playerStats.statistics?.[0] || {};
                    const goals = stats.goals?.total || 0;
                    const assists = stats.goals?.assists || 0;
                    const minutes = stats.games?.minutes || 0;
                    
                    if (minutes > 0) {
                      goalsLastN += goals;
                      assistsLastN += assists;
                      minutesLastN += minutes;
                      matchesAnalyzed++;
                      if (goals > 0 || assists > 0) {
                        decisiveMatches++;
                      }
                    }
                    break;
                  }
                }
              }
              
              if (matchesAnalyzed > 0) {
                const totalDecisiveLastN = goalsLastN + assistsLastN;
                const decisiveRatio = decisiveMatches / matchesAnalyzed;
                const dPer90LastN = minutesLastN >= 45 ? (totalDecisiveLastN / minutesLastN) * 90 : 0;
                
                const playerForm = {
                  playerId: player.playerId,
                  playerName: player.playerName,
                  playerPhoto: player.playerPhoto,
                  teamId: player.teamId,
                  teamName: player.teamName,
                  teamLogo: player.teamLogo,
                  goals: goalsLastN,
                  assists: assistsLastN,
                  decisive: totalDecisiveLastN,
                  matches: matchesAnalyzed,
                  minutes: minutesLastN,
                  goalsPer90: minutesLastN >= 45 ? (goalsLastN / minutesLastN) * 90 : 0,
                  assistsPer90: minutesLastN >= 45 ? (assistsLastN / minutesLastN) * 90 : 0,
                  decisivePer90: dPer90LastN,
                  decisiveRatio: decisiveRatio,
                  goalStreak: 0,
                  decisiveStreak: 0,
                  period: n,
                  isRealData: true,
                };
                
                cache.set(playerFormCacheKey, playerForm, 1800);
                playersWithRealForm.push(playerForm);
                continue;
              }
            }
          } catch (err) {
            console.error(`[top-form] Error fetching real form for player ${player.playerId}:`, err);
          }
          
          const { seasonGoals, seasonAssists, seasonMatches, seasonMinutes } = player;
          const matchesInPeriod = Math.min(seasonMatches, n);
          const goalsPerMatch = seasonGoals / seasonMatches;
          const assistsPerMatch = seasonAssists / seasonMatches;
          const minutesPerMatch = seasonMinutes / seasonMatches;
          const decisivePerMatch = (seasonGoals + seasonAssists) / seasonMatches;
          
          const goalsLastN = goalsPerMatch * matchesInPeriod;
          const assistsLastN = assistsPerMatch * matchesInPeriod;
          const totalDecisiveLastN = goalsLastN + assistsLastN;
          const minutesLastN = minutesPerMatch * matchesInPeriod;
          const dPer90LastN = minutesLastN >= 45 ? (totalDecisiveLastN / minutesLastN) * 90 : 0;
          const decisiveRatio = Math.min(1, decisivePerMatch);
          
          const fallbackForm = {
            playerId: player.playerId,
            playerName: player.playerName,
            playerPhoto: player.playerPhoto,
            teamId: player.teamId,
            teamName: player.teamName,
            teamLogo: player.teamLogo,
            goals: Math.round(goalsLastN),
            assists: Math.round(assistsLastN),
            decisive: Math.round(totalDecisiveLastN),
            matches: matchesInPeriod,
            minutes: Math.round(minutesLastN),
            goalsPer90: minutesLastN >= 45 ? (goalsLastN / minutesLastN) * 90 : 0,
            assistsPer90: minutesLastN >= 45 ? (assistsLastN / minutesLastN) * 90 : 0,
            decisivePer90: dPer90LastN,
            decisiveRatio: decisiveRatio,
            goalStreak: 0,
            decisiveStreak: 0,
            period: n,
            isRealData: false,
          };
          
          playersWithRealForm.push(fallbackForm);
        }
        
        topPlayers = playersWithRealForm
          .sort((a, b) => b.decisivePer90 - a.decisivePer90)
          .slice(0, 10);
        
        const realDataCount = topPlayers.filter(p => p.isRealData).length;
        isSeasonFallback = realDataCount < 5;
      }
      
      if (topPlayers.length === 0) {
        isSeasonFallback = true;
        
        topPlayers = candidatePlayers.slice(0, 10).map(player => {
          const { seasonGoals, seasonAssists, seasonMatches, seasonMinutes } = player;
          return {
            playerId: player.playerId,
            playerName: player.playerName,
            playerPhoto: player.playerPhoto,
            teamId: player.teamId,
            teamName: player.teamName,
            teamLogo: player.teamLogo,
            goals: seasonGoals,
            assists: seasonAssists,
            decisive: seasonGoals + seasonAssists,
            matches: seasonMatches,
            minutes: seasonMinutes,
            goalsPer90: seasonMinutes > 0 ? (seasonGoals / seasonMinutes) * 90 : 0,
            assistsPer90: seasonMinutes > 0 ? (seasonAssists / seasonMinutes) * 90 : 0,
            decisivePer90: seasonMinutes > 0 ? ((seasonGoals + seasonAssists) / seasonMinutes) * 90 : 0,
            decisiveRatio: seasonMatches > 0 ? Math.min(1, (seasonGoals + seasonAssists) / seasonMatches) : 0,
            goalStreak: 0,
            decisiveStreak: 0,
            period: n,
          };
        }).sort((a, b) => b.decisivePer90 - a.decisivePer90);
      }

      const response = {
        players: topPlayers,
        isSeasonFallback,
        period: n,
      };

      cache.set(cacheKey, response, 1800);

      res.json(response);
    } catch (error: any) {
      console.error('[/api/football/players/top-form] Exception:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const rateLimitKey = `contact-ratelimit-${clientIp}`;
      const currentCount = cache.get<number>(rateLimitKey) || 0;
      
      if (currentCount >= 5) {
        console.log(`[/api/contact] Rate limit exceeded for IP: ${clientIp}`);
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
      
      cache.set(rateLimitKey, currentCount + 1, 3600);
      
      const { name, email, message } = req.body;
      
      const sanitizeInput = (input: string | undefined): string => {
        if (!input) return '';
        return input
          .replace(/[\r\n]/g, ' ')
          .replace(/<[^>]*>/g, '')
          .trim()
          .slice(0, 500);
      };
      
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email);
      
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      if (message.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
      }
      
      const sanitizedMessage = message
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim()
        .slice(0, 5000);
      
      const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;
      
      if (formspreeEndpoint) {
        const formspreeResponse = await fetch(formspreeEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: sanitizedName || 'Anonymous',
            email: sanitizedEmail || 'No email provided',
            message: sanitizedMessage,
            _subject: `[FootStats] Message from ${sanitizedName || 'Anonymous'}`
          })
        });
        
        if (!formspreeResponse.ok) {
          console.error('[/api/contact] Formspree error:', formspreeResponse.status);
          return res.status(500).json({ error: 'Failed to send message' });
        }
        
        console.log('[Contact Form] Sent to Formspree:', {
          name: sanitizedName || 'Anonymous',
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log('[Contact Form] No Formspree endpoint configured. Message logged:', {
          name: sanitizedName || 'Anonymous',
          email: sanitizedEmail || 'No email',
          message: sanitizedMessage.substring(0, 100) + (sanitizedMessage.length > 100 ? '...' : ''),
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json({ success: true, message: 'Message received' });
    } catch (error: any) {
      console.error('[/api/contact] Exception:', error);
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
