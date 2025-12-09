import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/appStore";
import { t } from "@/lib/i18n";
import { TIER_1_COMPETITIONS, TIER_2_COMPETITIONS, getAvailableSeasons } from "@/config/competitions";
import { UsageWidget } from "./UsageWidget";
import { Tier2ConfirmDialog } from "./Tier2ConfirmDialog";

export function Header() {
  const [location] = useLocation();
  const { 
    language, 
    setLanguage, 
    theme, 
    toggleTheme,
    selectedCompetitionId,
    setSelectedCompetition,
    selectedSeason,
    setSelectedSeason,
    showTier2,
    setTier2ConfirmPending,
  } = useAppStore();

  const competitions = showTier2 
    ? [...TIER_1_COMPETITIONS, ...TIER_2_COMPETITIONS]
    : TIER_1_COMPETITIONS;
  const seasons = getAvailableSeasons();

  const navItems = [
    { path: "/", label: t(language, 'nav.globalStats'), icon: BarChart3 },
    { path: "/form", label: t(language, 'nav.playerForm'), icon: TrendingUp },
    { path: "/matches", label: t(language, 'nav.todayMatches'), icon: Calendar },
  ];

  const handleTier2Toggle = () => {
    if (!showTier2) {
      setTier2ConfirmPending(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg hidden sm:block">FootStats</span>
            </div>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-${item.path === '/' ? 'stats' : item.path.slice(1)}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden md:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <UsageWidget />
              
              <Select
                value={selectedCompetitionId.toString()}
                onValueChange={(v) => setSelectedCompetition(Number(v))}
              >
                <SelectTrigger className="w-[140px] md:w-[180px]" data-testid="select-competition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {t(language, 'common.tier1')}
                  </div>
                  {TIER_1_COMPETITIONS.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      <div className="flex items-center gap-2">
                        <img src={comp.logo} alt="" className="w-4 h-4" />
                        <span className="truncate">{comp.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {showTier2 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">
                        {t(language, 'common.tier2')}
                      </div>
                      {TIER_2_COMPETITIONS.map((comp) => (
                        <SelectItem key={comp.id} value={comp.id.toString()}>
                          <div className="flex items-center gap-2">
                            <img src={comp.logo} alt="" className="w-4 h-4" />
                            <span className="truncate">{comp.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {!showTier2 && (
                    <div 
                      className="px-2 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-muted rounded-md mt-2"
                      onClick={handleTier2Toggle}
                    >
                      + {t(language, 'common.tier2')}
                    </div>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={selectedSeason.toString()}
                onValueChange={(v) => setSelectedSeason(Number(v))}
              >
                <SelectTrigger className="w-[90px]" data-testid="select-season">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season} value={season.toString()}>
                      {season}/{(season + 1).toString().slice(-2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                data-testid="button-language"
              >
                <Globe className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <Tier2ConfirmDialog />
    </>
  );
}
