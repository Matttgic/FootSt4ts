import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Target, Users, Clock, Flame, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Trophy, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { TeamLogo } from "@/components/shared/TeamLogo";
import { ProbabilityBar } from "@/components/shared/ProbabilityBar";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { calculatePlayerProbability } from "@/lib/probability";
import type { PlayerFormData, MergedPlayerStats } from "@shared/schema";

interface TopFormPlayer {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  teamId: number;
  teamName: string;
  teamLogo: string;
  goals: number;
  assists: number;
  decisive: number;
  matches: number;
  minutes: number;
  goalsPer90: number;
  assistsPer90: number;
  decisivePer90: number;
  decisiveRatio: number;
  goalStreak: number;
  decisiveStreak: number;
}

type TopFormSortField = 'goals' | 'assists' | 'decisive' | 'decisivePer90' | 'decisiveRatio';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useMemo(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function PlayerForm() {
  const { 
    language, 
    selectedCompetitionId, 
    selectedSeason,
    formPeriod,
    setFormPeriod,
    setLeagueSeason,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: leagueInfo } = useQuery<any[]>({
    queryKey: ['/api/football/leagues', selectedCompetitionId],
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (leagueInfo && leagueInfo.length > 0) {
      const league = leagueInfo[0];
      if (league.currentSeason) {
        setLeagueSeason(selectedCompetitionId, league.currentSeason);
      }
    }
  }, [leagueInfo, selectedCompetitionId, setLeagueSeason]);

  const effectiveSeason = useMemo(() => {
    if (leagueInfo && leagueInfo.length > 0 && leagueInfo[0].currentSeason) {
      return leagueInfo[0].currentSeason;
    }
    return selectedSeason;
  }, [leagueInfo, selectedSeason]);

  const [topFormSortField, setTopFormSortField] = useState<TopFormSortField>('decisivePer90');
  const [topFormSortDir, setTopFormSortDir] = useState<'asc' | 'desc'>('desc');

  const { data: topFormData, isLoading: isLoadingTopForm } = useQuery<{ players: TopFormPlayer[]; isSeasonFallback: boolean }>({
    queryKey: ['/api/football/players/top-form', selectedCompetitionId, effectiveSeason],
    enabled: !!effectiveSeason,
    staleTime: 30 * 60 * 1000,
  });

  const topFormPlayers = topFormData?.players;
  const isSeasonFallback = topFormData?.isSeasonFallback;

  const sortedTopFormPlayers = useMemo(() => {
    if (!topFormPlayers) return [];
    return [...topFormPlayers].sort((a, b) => {
      const aVal = a[topFormSortField];
      const bVal = b[topFormSortField];
      return topFormSortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [topFormPlayers, topFormSortField, topFormSortDir]);

  const handleTopFormSort = (field: TopFormSortField) => {
    if (topFormSortField === field) {
      setTopFormSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTopFormSortField(field);
      setTopFormSortDir('desc');
    }
  };

  const renderTopFormSortIcon = (field: TopFormSortField) => {
    if (topFormSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return topFormSortDir === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const { data: searchResults, isLoading: isSearching, error: searchError } = useQuery<any[]>({
    queryKey: ['/api/football/players/search', selectedCompetitionId, effectiveSeason, debouncedSearch],
    enabled: debouncedSearch.length >= 3 && !!effectiveSeason,
  });

  const { data: playerForm, isLoading: isLoadingForm, error: formError, refetch: refetchForm } = useQuery<PlayerFormData>({
    queryKey: [`/api/football/players/form/${selectedPlayerId}`, formPeriod, effectiveSeason],
    enabled: !!selectedPlayerId && !!effectiveSeason,
  });

  const { data: playerStats } = useQuery<MergedPlayerStats>({
    queryKey: [`/api/football/players/stats/${selectedPlayerId}`, selectedCompetitionId, effectiveSeason],
    enabled: !!selectedPlayerId && !!effectiveSeason,
  });

  const probability = useMemo(() => {
    if (!playerStats || !playerForm) return null;
    return calculatePlayerProbability(
      playerStats,
      playerForm,
      0.5,
      0.5,
      false,
      formPeriod
    );
  }, [playerStats, playerForm, formPeriod]);

  const chartData = useMemo(() => {
    if (!playerForm?.lastNMatches) return [];
    return [...playerForm.lastNMatches].reverse().map((match, index) => ({
      name: `M${index + 1}`,
      date: new Date(match.date).toLocaleDateString(),
      goals: match.goals,
      assists: match.assists,
      rating: match.rating ? parseFloat(match.rating) : null,
    }));
  }, [playerForm]);

  const handleSelectPlayer = useCallback((player: any) => {
    setSelectedPlayerId(player.player.id);
    setSearchQuery("");
  }, []);

  const getResultBadge = (result: 'W' | 'D' | 'L') => {
    const variants: Record<string, string> = {
      W: "bg-green-500/10 text-green-500 border-green-500/20",
      D: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      L: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return variants[result];
  };

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'goals': return <Target className="w-4 h-4 text-green-500" />;
      case 'assists': return <Users className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t(language, 'form.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t(language, 'form.description')}</p>
        </div>
        <Tabs value={formPeriod.toString()} onValueChange={(v) => setFormPeriod(Number(v) as 5 | 10)}>
          <TabsList>
            <TabsTrigger value="5" data-testid="period-5">{t(language, 'form.games5')}</TabsTrigger>
            <TabsTrigger value="10" data-testid="period-10">{t(language, 'form.games10')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isDev && (
        <div className="text-xs font-mono bg-muted/50 p-2 rounded-md text-muted-foreground">
          Debug: leagueId = {selectedCompetitionId}, season = {effectiveSeason}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t(language, 'form.searchPlayer')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-player-search"
        />
        
        {debouncedSearch.length >= 3 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto">
            <CardContent className="p-2">
              {isSearching ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                <p className="text-center text-destructive py-4">Error loading results</p>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((result: any) => (
                    <Button
                      key={result.player.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2"
                      onClick={() => handleSelectPlayer(result)}
                      data-testid={`search-result-${result.player.id}`}
                    >
                      <PlayerAvatar 
                        name={result.player.name} 
                        photo={result.player.photo}
                        size="sm"
                      />
                      <div className="ml-3 text-left">
                        <p className="font-medium">{result.player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.statistics?.[0]?.team?.name || 'Unknown team'}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">{t(language, 'common.noData')}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {!selectedPlayerId && !playerForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {t(language, 'form.top10Title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t(language, 'form.top10Desc')}</p>
            {isSeasonFallback && !isLoadingTopForm && sortedTopFormPlayers.length > 0 && (
              <p className="text-xs text-amber-500 dark:text-amber-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t(language, 'form.seasonStatsFallback')}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingTopForm ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-16 h-4 ml-auto" />
                  </div>
                ))}
              </div>
            ) : sortedTopFormPlayers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{t(language, 'common.player')}</TableHead>
                      <TableHead>{t(language, 'common.team')}</TableHead>
                      <TableHead 
                        className="text-center cursor-pointer select-none" 
                        onClick={() => handleTopFormSort('goals')}
                        data-testid="sort-goals"
                      >
                        <span className="flex items-center justify-center">
                          {t(language, 'common.goals')}
                          {renderTopFormSortIcon('goals')}
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer select-none" 
                        onClick={() => handleTopFormSort('assists')}
                        data-testid="sort-assists"
                      >
                        <span className="flex items-center justify-center">
                          {t(language, 'common.assists')}
                          {renderTopFormSortIcon('assists')}
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer select-none" 
                        onClick={() => handleTopFormSort('decisive')}
                        data-testid="sort-decisive"
                      >
                        <span className="flex items-center justify-center">
                          G+A
                          {renderTopFormSortIcon('decisive')}
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer select-none" 
                        onClick={() => handleTopFormSort('decisivePer90')}
                        data-testid="sort-decisive-per90"
                      >
                        <span className="flex items-center justify-center">
                          {t(language, 'stats.decisivePer90')}
                          {renderTopFormSortIcon('decisivePer90')}
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer select-none" 
                        onClick={() => handleTopFormSort('decisiveRatio')}
                        data-testid="sort-decisive-ratio"
                      >
                        <span className="flex items-center justify-center">
                          {t(language, 'stats.decisiveRatio')}
                          {renderTopFormSortIcon('decisiveRatio')}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTopFormPlayers.map((player, index) => (
                      <TableRow 
                        key={player.playerId} 
                        className="cursor-pointer hover-elevate"
                        onClick={() => setSelectedPlayerId(player.playerId)}
                        data-testid={`top-form-row-${player.playerId}`}
                      >
                        <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PlayerAvatar 
                              name={player.playerName} 
                              photo={player.playerPhoto}
                              size="sm"
                            />
                            <span className="font-medium">{player.playerName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TeamLogo 
                              name={player.teamName} 
                              logo={player.teamLogo}
                              size="sm"
                            />
                            <span className="text-muted-foreground text-sm hidden sm:inline">{player.teamName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-green-500">{player.goals}</TableCell>
                        <TableCell className="text-center font-mono text-blue-500">{player.assists}</TableCell>
                        <TableCell className="text-center font-mono font-bold">{player.decisive}</TableCell>
                        <TableCell className="text-center font-mono">{player.decisivePer90.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              player.decisiveRatio >= 0.7 
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : player.decisiveRatio >= 0.4
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-muted text-muted-foreground"
                            )}
                          >
                            {(player.decisiveRatio * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState 
                message={t(language, 'form.noFormData')}
                icon={<Trophy className="w-12 h-12 text-muted-foreground" />}
              />
            )}
          </CardContent>
        </Card>
      )}

      {selectedPlayerId && formError && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Player Form</AlertTitle>
            <AlertDescription>
              {formError instanceof Error ? formError.message : 'Failed to load player data'}
            </AlertDescription>
          </Alert>
          <ErrorState onRetry={refetchForm} />
        </div>
      )}

      {selectedPlayerId && isLoadingForm && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="w-40 h-6" />
                <Skeleton className="w-32 h-4" />
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <Skeleton className="w-full h-64" />
            </CardContent>
          </Card>
        </div>
      )}

      {playerForm && !isLoadingForm && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <PlayerAvatar 
                  name={playerForm.playerName} 
                  photo={playerForm.playerPhoto}
                  size="lg"
                />
                <div className="text-center">
                  <h2 className="text-xl font-bold">{playerForm.playerName}</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <TeamLogo 
                      name={playerForm.teamName} 
                      logo={playerForm.teamLogo}
                      size="sm"
                    />
                    <span className="text-muted-foreground">{playerForm.teamName}</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold font-mono text-green-500">{playerForm.totalGoals}</p>
                    <p className="text-xs text-muted-foreground">{t(language, 'common.goals')}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold font-mono text-blue-500">{playerForm.totalAssists}</p>
                    <p className="text-xs text-muted-foreground">{t(language, 'common.assists')}</p>
                  </div>
                </div>

                <div className="w-full p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">{t(language, 'form.currentStreak')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStreakIcon(playerForm.currentStreak.type)}
                    <span className="font-mono font-bold">
                      {playerForm.currentStreak.count > 0 
                        ? `${playerForm.currentStreak.count} ${playerForm.currentStreak.type === 'goals' ? t(language, 'form.goalStreak') : t(language, 'form.assistStreak')}`
                        : t(language, 'form.noStreak')
                      }
                    </span>
                  </div>
                </div>

                {probability && (
                  <div className="w-full space-y-3 mt-2">
                    <h3 className="text-sm font-medium">{t(language, 'probability.title')}</h3>
                    <ProbabilityBar 
                      probability={probability.scoreProb}
                      label={t(language, 'probability.toScore')}
                      dataQuality={probability.dataQuality}
                      factors={probability.factors}
                    />
                    <ProbabilityBar 
                      probability={probability.assistProb}
                      label={t(language, 'probability.toAssist')}
                      dataQuality={probability.dataQuality}
                      factors={probability.factors}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t(language, 'form.formChart')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="goals" 
                        name={t(language, 'common.goals')}
                        stroke="hsl(142 76% 36%)" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(142 76% 36%)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="assists" 
                        name={t(language, 'common.assists')}
                        stroke="hsl(221 83% 53%)" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(221 83% 53%)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t(language, 'form.recentMatches')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t(language, 'common.date')}</TableHead>
                        <TableHead>vs</TableHead>
                        <TableHead className="text-center">{t(language, 'common.goals')}</TableHead>
                        <TableHead className="text-center">{t(language, 'common.assists')}</TableHead>
                        <TableHead className="text-center">{t(language, 'common.minutes')}</TableHead>
                        <TableHead className="text-center">{t(language, 'common.rating')}</TableHead>
                        <TableHead className="text-center">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playerForm.lastNMatches.map((match) => (
                        <TableRow key={match.fixtureId}>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(match.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TeamLogo 
                                name={match.opponent} 
                                logo={match.opponentLogo}
                                size="sm"
                              />
                              <span className="text-sm">{match.opponent}</span>
                              <Badge variant="outline" className="text-xs">
                                {match.isHome ? t(language, 'common.home') : t(language, 'common.away')}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium text-green-500">
                            {match.goals}
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium text-blue-500">
                            {match.assists}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {match.minutes}'
                          </TableCell>
                          <TableCell className="text-center">
                            {match.rating && (
                              <Badge 
                                variant="outline"
                                className={cn(
                                  "font-mono",
                                  parseFloat(match.rating) >= 7 && "text-green-500 border-green-500/20",
                                  parseFloat(match.rating) >= 6 && parseFloat(match.rating) < 7 && "text-amber-500 border-amber-500/20",
                                  parseFloat(match.rating) < 6 && "text-red-500 border-red-500/20"
                                )}
                              >
                                {parseFloat(match.rating).toFixed(1)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={getResultBadge(match.result)}>
                              {match.result}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
