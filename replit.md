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
GET /api/football/stats/merged - Combined scorers/assisters
GET /api/football/players/search - Player search
GET /api/football/players/form/:id - Player form data
GET /api/football/players/stats/:id - Player season stats
GET /api/football/fixtures/date - Fixtures by date
```

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

- Initial implementation of all three pages
- Secure API proxy with caching and rate limiting
- Probability calculation system
- i18n support (EN/FR)
- Dark mode toggle
- Favorites system with localStorage persistence
