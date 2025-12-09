import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, Theme, Favorite, ApiUsage } from '@shared/schema';
import { TIER_1_COMPETITIONS, getCurrentSeasonYear } from '@/config/competitions';

interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  logo: string;
  currentSeason: number;
  seasons: { year: number; start: string; end: string; current: boolean }[];
}

interface AppState {
  language: Language;
  theme: Theme;
  selectedCompetitionId: number;
  selectedSeason: number;
  selectedDate: string;
  formPeriod: 5 | 10;
  showTier2: boolean;
  tier2ConfirmPending: boolean;
  favorites: Favorite[];
  showFavoritesOnly: boolean;
  highlightFavorites: boolean;
  apiUsage: ApiUsage;
  leagueSeasons: Record<number, number>;
  
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSelectedCompetition: (id: number) => void;
  setSelectedSeason: (season: number) => void;
  setSelectedDate: (date: string) => void;
  setFormPeriod: (period: 5 | 10) => void;
  setShowTier2: (show: boolean) => void;
  setTier2ConfirmPending: (pending: boolean) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (type: 'player' | 'team', id: number) => void;
  isFavorite: (type: 'player' | 'team', id: number) => boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  setHighlightFavorites: (highlight: boolean) => void;
  updateApiUsage: (usage: Partial<ApiUsage>) => void;
  setLeagueSeason: (leagueId: number, season: number) => void;
  getLeagueSeason: (leagueId: number) => number;
}

const getToday = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
      theme: 'dark',
      selectedCompetitionId: TIER_1_COMPETITIONS[0]?.id ?? 39,
      selectedSeason: getCurrentSeasonYear(),
      selectedDate: getToday(),
      formPeriod: 5,
      showTier2: false,
      tier2ConfirmPending: false,
      favorites: [],
      showFavoritesOnly: false,
      highlightFavorites: true,
      apiUsage: {
        callsToday: 0,
        limit: 7500,
        percentage: 0,
        warningLevel: 'normal',
        lastReset: getToday(),
      },
      leagueSeasons: {},

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(newTheme);
      },
      setSelectedCompetition: (selectedCompetitionId) => {
        const leagueSeason = get().leagueSeasons[selectedCompetitionId];
        if (leagueSeason) {
          set({ selectedCompetitionId, selectedSeason: leagueSeason });
        } else {
          set({ selectedCompetitionId, selectedSeason: getCurrentSeasonYear() });
        }
      },
      setSelectedSeason: (selectedSeason) => set({ selectedSeason }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setFormPeriod: (formPeriod) => set({ formPeriod }),
      setShowTier2: (showTier2) => set({ showTier2, tier2ConfirmPending: false }),
      setTier2ConfirmPending: (tier2ConfirmPending) => set({ tier2ConfirmPending }),
      addFavorite: (favorite) => set((state) => {
        const exists = state.favorites.some(f => f.type === favorite.type && f.id === favorite.id);
        if (exists) return state;
        return { favorites: [...state.favorites, favorite] };
      }),
      removeFavorite: (type, id) => set((state) => ({
        favorites: state.favorites.filter(f => !(f.type === type && f.id === id)),
      })),
      isFavorite: (type, id) => get().favorites.some(f => f.type === type && f.id === id),
      setShowFavoritesOnly: (showFavoritesOnly) => set({ showFavoritesOnly }),
      setHighlightFavorites: (highlightFavorites) => set({ highlightFavorites }),
      updateApiUsage: (usage) => set((state) => ({
        apiUsage: { ...state.apiUsage, ...usage },
      })),
      setLeagueSeason: (leagueId, season) => set((state) => ({
        leagueSeasons: { ...state.leagueSeasons, [leagueId]: season },
      })),
      getLeagueSeason: (leagueId) => {
        return get().leagueSeasons[leagueId] || getCurrentSeasonYear();
      },
    }),
    {
      name: 'football-stats-storage',
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        selectedCompetitionId: state.selectedCompetitionId,
        selectedSeason: state.selectedSeason,
        formPeriod: state.formPeriod,
        showTier2: state.showTier2,
        favorites: state.favorites,
        showFavoritesOnly: state.showFavoritesOnly,
        highlightFavorites: state.highlightFavorites,
        leagueSeasons: state.leagueSeasons,
      }),
    }
  )
);
