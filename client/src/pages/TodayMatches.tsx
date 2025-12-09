import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp, Target, Users, Flame, AlertCircle } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamLogo } from "@/components/shared/TeamLogo";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { ProbabilityBar } from "@/components/shared/ProbabilityBar";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { MatchWithPlayers, PlayerProbability } from "@shared/schema";

function MatchCard({ match }: { match: MatchWithPlayers }) {
  const { language } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const fixture = match.fixture;
  const kickoffTime = new Date(fixture.fixture.date);
  const isLive = fixture.fixture.status.short === 'LIVE' || 
                 fixture.fixture.status.short === '1H' || 
                 fixture.fixture.status.short === '2H' ||
                 fixture.fixture.status.short === 'HT';
  const isFinished = fixture.fixture.status.short === 'FT' || 
                     fixture.fixture.status.short === 'AET' ||
                     fixture.fixture.status.short === 'PEN';

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <Badge className="bg-red-500 text-white animate-pulse">
          {t(language, 'matches.live')}
        </Badge>
      );
    }
    if (isFinished) {
      return (
        <Badge variant="secondary">
          {t(language, 'matches.finished')}
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {t(language, 'matches.upcoming')}
      </Badge>
    );
  };

  const PlayerProbabilityRow = ({ player, type }: { player: PlayerProbability; type: 'score' | 'assist' }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
      <PlayerAvatar name={player.playerName} photo={player.playerPhoto} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{player.playerName}</p>
        <p className="text-xs text-muted-foreground">{player.teamName}</p>
      </div>
      <div className="w-20">
        <ProbabilityBar 
          probability={type === 'score' ? player.scoreProb : player.assistProb}
          label=""
          dataQuality={player.dataQuality}
        />
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={fixture.league.logo || ''} 
                  alt={fixture.league.name}
                  className="w-5 h-5 object-contain"
                />
                <span className="text-xs text-muted-foreground">
                  {fixture.league.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {format(kickoffTime, 'HH:mm')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3 flex-1">
                <TeamLogo 
                  name={fixture.teams.home.name} 
                  logo={fixture.teams.home.logo}
                  size="lg"
                />
                <div className="text-left">
                  <p className="font-semibold">{fixture.teams.home.name}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {t(language, 'common.home')}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col items-center px-4">
                {isFinished || isLive ? (
                  <div className="text-2xl font-bold font-mono">
                    <span className={cn(
                      fixture.teams.home.winner && "text-green-500"
                    )}>{fixture.goals.home ?? 0}</span>
                    <span className="text-muted-foreground mx-2">-</span>
                    <span className={cn(
                      fixture.teams.away.winner && "text-green-500"
                    )}>{fixture.goals.away ?? 0}</span>
                  </div>
                ) : (
                  <span className="text-lg font-medium text-muted-foreground">vs</span>
                )}
                {isLive && fixture.fixture.status.elapsed && (
                  <span className="text-xs text-red-500 font-mono mt-1">
                    {fixture.fixture.status.elapsed}'
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="text-right">
                  <p className="font-semibold">{fixture.teams.away.name}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {t(language, 'common.away')}
                  </Badge>
                </div>
                <TeamLogo 
                  name={fixture.teams.away.name} 
                  logo={fixture.teams.away.logo}
                  size="lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-center mt-4">
              <Button variant="ghost" size="sm" className="gap-1">
                {isOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {t(language, 'matches.matchDetails')}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="border-t">
            <div className="grid gap-6 md:grid-cols-3 pt-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  {t(language, 'matches.topScorers')}
                </h4>
                {match.topScorers.length > 0 ? (
                  <div className="space-y-2">
                    {match.topScorers.slice(0, 3).map((player) => (
                      <PlayerProbabilityRow 
                        key={player.playerId} 
                        player={player} 
                        type="score" 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t(language, 'common.noData')}</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  {t(language, 'matches.topAssisters')}
                </h4>
                {match.topAssisters.length > 0 ? (
                  <div className="space-y-2">
                    {match.topAssisters.slice(0, 3).map((player) => (
                      <PlayerProbabilityRow 
                        key={player.playerId} 
                        player={player} 
                        type="assist" 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t(language, 'common.noData')}</p>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  {t(language, 'matches.inForm')}
                </h4>
                {match.inFormPlayers.length > 0 ? (
                  <div className="space-y-2">
                    {match.inFormPlayers.slice(0, 3).map((player) => (
                      <PlayerProbabilityRow 
                        key={player.playerId} 
                        player={player} 
                        type="score" 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t(language, 'common.noData')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function MatchCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-md" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-8 w-16" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="w-12 h-12 rounded-md" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function TodayMatches() {
  const { 
    language, 
    selectedCompetitionId,
    selectedSeason,
    selectedDate,
    setSelectedDate,
    setLeagueSeason,
  } = useAppStore();

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

  const { data: matches, isLoading, error, refetch } = useQuery<MatchWithPlayers[]>({
    queryKey: ['/api/football/fixtures/date', selectedDate, selectedCompetitionId, effectiveSeason],
    enabled: !!effectiveSeason,
  });

  const dateLabel = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = subDays(new Date(), 1).toISOString().split('T')[0];
    const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];
    
    if (selectedDate === today) return t(language, 'common.today');
    if (selectedDate === yesterday) return t(language, 'common.yesterday');
    if (selectedDate === tomorrow) return t(language, 'common.tomorrow');
    return format(new Date(selectedDate), 'PPP');
  }, [selectedDate, language]);

  const isDev = import.meta.env.DEV;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t(language, 'matches.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t(language, 'matches.description')}</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-date-picker">
              <CalendarIcon className="w-4 h-4" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={new Date(selectedDate)}
              onSelect={(date) => date && setSelectedDate(date.toISOString().split('T')[0])}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {isDev && (
        <div className="text-xs font-mono bg-muted/50 p-2 rounded-md text-muted-foreground">
          Debug: leagueId = {selectedCompetitionId}, season = {effectiveSeason}, date = {selectedDate}
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedDate(subDays(new Date(selectedDate), 1).toISOString().split('T')[0])}
        >
          {t(language, 'common.yesterday')}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          {t(language, 'common.today')}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedDate(addDays(new Date(selectedDate), 1).toISOString().split('T')[0])}
        >
          {t(language, 'common.tomorrow')}
        </Button>
      </div>

      {error && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Fixtures</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load fixtures'}
            </AlertDescription>
          </Alert>
          <ErrorState onRetry={refetch} />
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <MatchCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && !error && matches?.length === 0 && (
        <EmptyState 
          message={t(language, 'matches.noMatches')}
          icon={<CalendarIcon className="w-12 h-12 text-muted-foreground" />}
        />
      )}

      {!isLoading && !error && matches && matches.length > 0 && (
        <>
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              {t(language, 'matches.disclaimer')}
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <MatchCard key={match.fixture.fixture.id} match={match} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
