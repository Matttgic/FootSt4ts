import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { TeamLogo } from "@/components/shared/TeamLogo";
import { FavoriteButton } from "@/components/shared/FavoriteButton";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ColumnVisibilityMenu, type ColumnConfig } from "@/components/shared/ColumnVisibilityMenu";
import { FavoritesFilter } from "@/components/shared/FavoritesFilter";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { MergedPlayerStats } from "@shared/schema";

type SortField = 'goals' | 'assists' | 'matches' | 'minutes' | 'goalsPer90' | 'assistsPer90';
type SortDirection = 'asc' | 'desc';

export default function GlobalStats() {
  const { 
    language, 
    selectedCompetitionId, 
    selectedSeason,
    showFavoritesOnly,
    highlightFavorites,
    isFavorite,
  } = useAppStore();
  
  const [sortField, setSortField] = useState<SortField>('goals');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'player', label: t(language, 'common.player'), visible: true, required: true },
    { id: 'club', label: t(language, 'common.club'), visible: true, required: true },
    { id: 'goals', label: t(language, 'common.goals'), visible: true },
    { id: 'assists', label: t(language, 'common.assists'), visible: true },
    { id: 'matches', label: t(language, 'common.matches'), visible: true },
    { id: 'minutes', label: t(language, 'common.minutes'), visible: false },
    { id: 'goalsPer90', label: t(language, 'common.goalsPer90'), visible: true },
    { id: 'assistsPer90', label: t(language, 'common.assistsPer90'), visible: true },
  ]);

  const { data, isLoading, error, refetch } = useQuery<MergedPlayerStats[]>({
    queryKey: ['/api/football/stats/merged', selectedCompetitionId, selectedSeason],
  });

  const toggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    if (!data) return [];
    
    let filtered = [...data];
    
    if (showFavoritesOnly) {
      filtered = filtered.filter(player => isFavorite('player', player.playerId));
    }
    
    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });
  }, [data, sortField, sortDirection, showFavoritesOnly, isFavorite]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 ml-1" /> 
      : <ArrowDown className="w-3.5 h-3.5 ml-1" />;
  };

  const isColumnVisible = (id: string) => columns.find(c => c.id === id)?.visible ?? true;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">{t(language, 'stats.title')}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <FavoritesFilter />
          <ColumnVisibilityMenu columns={columns} onToggle={toggleColumn} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t(language, 'stats.merged')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 pb-4">
              <TableSkeleton columns={8} rows={15} />
            </div>
          ) : sortedData.length === 0 ? (
            <div className="p-4">
              <EmptyState />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="sticky left-0 bg-card z-10">{t(language, 'common.player')}</TableHead>
                    {isColumnVisible('club') && <TableHead>{t(language, 'common.club')}</TableHead>}
                    {isColumnVisible('goals') && (
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('goals')}
                          data-testid="sort-goals"
                        >
                          {t(language, 'common.goals')}
                          <SortIcon field="goals" />
                        </Button>
                      </TableHead>
                    )}
                    {isColumnVisible('assists') && (
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('assists')}
                          data-testid="sort-assists"
                        >
                          {t(language, 'common.assists')}
                          <SortIcon field="assists" />
                        </Button>
                      </TableHead>
                    )}
                    {isColumnVisible('matches') && (
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('matches')}
                          data-testid="sort-matches"
                        >
                          {t(language, 'common.matches')}
                          <SortIcon field="matches" />
                        </Button>
                      </TableHead>
                    )}
                    {isColumnVisible('minutes') && (
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('minutes')}
                          data-testid="sort-minutes"
                        >
                          {t(language, 'common.minutes')}
                          <SortIcon field="minutes" />
                        </Button>
                      </TableHead>
                    )}
                    {isColumnVisible('goalsPer90') && (
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('goalsPer90')}
                          data-testid="sort-goals-per-90"
                        >
                          {t(language, 'common.goalsPer90')}
                          <SortIcon field="goalsPer90" />
                        </Button>
                      </TableHead>
                    )}
                    {isColumnVisible('assistsPer90') && (
                      <TableHead>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-auto p-0 font-medium hover:bg-transparent"
                          onClick={() => handleSort('assistsPer90')}
                          data-testid="sort-assists-per-90"
                        >
                          {t(language, 'common.assistsPer90')}
                          <SortIcon field="assistsPer90" />
                        </Button>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((player, index) => {
                    const isPlayerFavorite = isFavorite('player', player.playerId);
                    return (
                      <TableRow 
                        key={player.playerId}
                        className={cn(
                          highlightFavorites && isPlayerFavorite && "bg-amber-500/5 border-l-2 border-l-amber-500"
                        )}
                        data-testid={`row-player-${player.playerId}`}
                      >
                        <TableCell className="w-8 pr-0">
                          <FavoriteButton 
                            type="player" 
                            id={player.playerId} 
                            name={player.playerName}
                            logo={player.playerPhoto}
                          />
                        </TableCell>
                        <TableCell className="sticky left-0 bg-card z-10">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm w-5">{index + 1}</span>
                            <PlayerAvatar name={player.playerName} photo={player.playerPhoto} size="sm" />
                            <span className="font-medium">{player.playerName}</span>
                          </div>
                        </TableCell>
                        {isColumnVisible('club') && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TeamLogo name={player.teamName} logo={player.teamLogo} size="sm" />
                              <span className="text-sm">{player.teamName}</span>
                            </div>
                          </TableCell>
                        )}
                        {isColumnVisible('goals') && (
                          <TableCell className="font-mono font-medium">{player.goals}</TableCell>
                        )}
                        {isColumnVisible('assists') && (
                          <TableCell className="font-mono font-medium">{player.assists}</TableCell>
                        )}
                        {isColumnVisible('matches') && (
                          <TableCell className="font-mono">{player.matches}</TableCell>
                        )}
                        {isColumnVisible('minutes') && (
                          <TableCell className="font-mono">{player.minutes.toLocaleString()}</TableCell>
                        )}
                        {isColumnVisible('goalsPer90') && (
                          <TableCell className="font-mono text-green-500">{player.goalsPer90.toFixed(2)}</TableCell>
                        )}
                        {isColumnVisible('assistsPer90') && (
                          <TableCell className="font-mono text-blue-500">{player.assistsPer90.toFixed(2)}</TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
