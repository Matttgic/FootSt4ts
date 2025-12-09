export const API_LIMITS = {
  DAILY_LIMIT: 7500,
  WARNING_THRESHOLD: 0.8,
  CRITICAL_THRESHOLD: 0.95,
  CACHE_TTL: {
    TOP_SCORERS: 30 * 60 * 1000,
    TOP_ASSISTS: 30 * 60 * 1000,
    FIXTURES: 10 * 60 * 1000,
    PLAYER_STATS: 60 * 60 * 1000,
    FIXTURE_PLAYERS: 30 * 60 * 1000,
  },
};

export const isHeavyAction = (endpoint: string): boolean => {
  const heavyEndpoints = [
    '/fixtures/players',
    '/players/topscorers',
    '/players/topassists',
  ];
  return heavyEndpoints.some(e => endpoint.includes(e));
};

export const getWarningLevel = (percentage: number): 'normal' | 'warning' | 'critical' => {
  if (percentage >= API_LIMITS.CRITICAL_THRESHOLD) return 'critical';
  if (percentage >= API_LIMITS.WARNING_THRESHOLD) return 'warning';
  return 'normal';
};
