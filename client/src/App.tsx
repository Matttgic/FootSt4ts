import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { UsageBanner } from "@/components/layout/UsageBanner";
import { useAppStore } from "@/stores/appStore";
import GlobalStats from "@/pages/GlobalStats";
import PlayerForm from "@/pages/PlayerForm";
import TodayMatches from "@/pages/TodayMatches";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GlobalStats} />
      <Route path="/form" component={PlayerForm} />
      <Route path="/matches" component={TodayMatches} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('football-stats-storage');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        if (parsed.state?.theme) {
          setTheme(parsed.state.theme);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <UsageBanner />
      <main>
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
