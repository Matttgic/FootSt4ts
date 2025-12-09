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
- `client/src/pages/GlobalStats.tsx` - Top scorers/assisters table with Decisive stats
- `client/src/pages/PlayerForm.tsx` - Player form analysis with Auto Top 10 and streak detection
- `client/src/pages/TodayMatches.tsx` - Today's fixtures with probability calculations
- `client/src/pages/Donate.tsx` - BuyMeACoffee donation support page
- `client/src/pages/Contact.tsx` - Contact/feedback form

### Components
- `client/src/components/layout/` - Header, Footer, UsageWidget, Tier2Dialog
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
GET /api/football/players/top-form?league={id}&season={year} - Top 10 form players (season stats)
POST /api/contact - Submit contact/feedback form
```

## Dynamic Season Detection

The app automatically detects the current season for each league:
1. Frontend fetches `/api/football/leagues?id={leagueId}` 
2. API returns league info including `currentSeason` (detected via `current: true` flag)
3. All subsequent API calls use this detected season
4. No hardcoded seasons in code - all dynamically determined

## Environment Variables

- `API_FOOTBALL_KEY` - Required. API-Football API key (stored in Secrets)
- `FORMSPREE_ENDPOINT` - Optional. Formspree endpoint for contact form (e.g., https://formspree.io/f/YOUR_FORM_ID)

### Setting up Contact Form Email Delivery

To receive contact form messages at your email:
1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create a new form with your email address
3. Copy the form endpoint (looks like `https://formspree.io/f/abcd1234`)
4. Add it as a secret: `FORMSPREE_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID`

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

## Recent Changes (December 2025)

### Latest
- **Top 10 Form improvements**:
  - Period toggle (5/10 matches) now included in query key - changes cached data correctly
  - Added "Decisive %" column with tooltip explaining it's the probability of being decisive per match
  - Badge shows current period selection (Last 5 matches / Last 10 matches)
  - Updated descriptions to clarify: Top 10 shows projections, click player for actual match data
- Contact form security: Rate limiting (5/hour per IP) and input sanitization added
- Updated Donate page with Ko-fi (https://ko-fi.com/footst4ts) and PayPal (https://paypal.me/M0012) buttons
- Contact form now sends to backend proxy (/api/contact) - email not exposed on frontend

### Design Decisions
- **True Last-N Match Data**: Top 10 Form now fetches ACTUAL per-fixture player stats via `/fixtures/players` API for the top 10 candidates. Goals, assists, and decisive ratio are computed from real match data (not season averages).
- **Aggressive Caching for API Efficiency**: Team fixtures cached 1 hour, fixture/player data cached 24 hours, computed player form cached 30 minutes. This limits API calls to ~2 initial calls + up to 10×N fixture/player calls per cache miss (with aggressive caching, typically <50 calls/hour).
- **Fallback Indicator**: `isRealData` flag distinguishes actual match data from season-based estimates. Fallback only shows if <5 players have real data.

### Previous
- Added Donate page with donation links
- Added Contact page with feedback form and backend endpoint
- Added Footer component with legal disclaimer about betting
- Fixed Badge component to use React.forwardRef for proper ref handling
- Updated navigation with Donate and Contact links
- Added comprehensive i18n translations for all new pages (EN/FR)
- Added legal disclaimers on Today's Matches page (probabilities are statistical only, not betting advice)

### Previous
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
