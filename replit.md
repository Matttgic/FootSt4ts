# Football Statistics Application

## Overview

A production-ready web application for football statistics and player probabilities using API-Football v3. The app features three main pages: Global Stats, Player Form & Streaks, and Today's Matches, with a transparent probability calculation system.

## Architecture

### Frontend (`client/`)
- React 18 with TypeScript
- Tailwind CSS for styling with dark mode support
- Zustand for global state management
- TanStack React Query for server state and caching
- Wouter for routing
- Recharts for data visualization

### Backend (`server/`)
- Express.js with TypeScript
- node-cache for server-side caching (10-60 min TTL)
- Secure API proxy with rate limiting

### Shared (`shared/`)
- TypeScript interfaces and Zod schemas
- Used by both frontend and backend

## Key Files

### Configuration
- `client/src/config/competitions.ts` - Competition tiers (Tier 1/Tier 2)
- `client/src/config/apiLimits.ts` - API rate limiting config
- `server/apiConfig.ts` - Server-side API configuration

### State Management
- `client/src/stores/appStore.ts` - Zustand store for language, theme, filters, favorites

### Pages
- `client/src/pages/GlobalStats.tsx` - Top scorers/assisters table
- `client/src/pages/PlayerForm.tsx` - Player form analysis
- `client/src/pages/TodayMatches.tsx` - Today's fixtures

### Components
- `client/src/components/layout/` - Header, UsageWidget, Tier2Dialog
- `client/src/components/shared/` - Reusable UI components

## API Routes

All routes go through secure proxy:

```
GET /api/football/usage - API usage stats
GET /api/football/leagues?id={leagueId} - Get league info with current season
GET /api/football/stats/merged?league={id}&season={year} - Combined scorers/assisters
GET /api/football/players/search?league={id}&season={year}&search={query} - Player search
GET /api/football/players/form/:id?period={5|10}&season={year} - Player form data
GET /api/football/players/stats/:id?league={id}&season={year} - Player season stats
GET /api/football/fixtures/date?date={YYYY-MM-DD}&league={id}&season={year} - Fixtures by date
```

## Dynamic Season Detection

The app automatically detects the current season for each league:
1. Frontend fetches `/api/football/leagues?id={leagueId}` 
2. API returns league info including `currentSeason` (detected via `current: true` flag)
3. All subsequent API calls use this detected season
4. No hardcoded seasons in code - all dynamically determined

## Environment Variables

- `API_FOOTBALL_KEY` - Required. API-Football API key (stored in Secrets)

## Running the App

```bash
npm install
npm run dev
```

Server runs on port 5000.

## Design Guidelines

The app follows the design_guidelines.md file for:
- Dark mode with gray-950 base background
- Inter font for UI, JetBrains Mono for numbers
- Data-first design with sortable tables
- Skeleton loading states
- Color-coded probabilities (green > 70%, amber > 40%, red < 40%)

## Recent Changes

- Fixed data fetching issues - all pages now show real player statistics
- Implemented dynamic season detection via `/api/football/leagues` endpoint
- Added debug info display in dev mode (leagueId, season, scorersCount, assistersCount)
- Enhanced error handling with visible error alerts showing API status codes
- Updated all pages (GlobalStats, PlayerForm, TodayMatches) to use dynamic season from API
- Initial implementation of all three pages
- Secure API proxy with caching and rate limiting
- Probability calculation system
- i18n support (EN/FR)
- Dark mode toggle
- Favorites system with localStorage persistence
