# Football Statistics & Player Probabilities

A production-ready web application for football statistics and player probabilities using API-Football v3.

## Features

### Pages

1. **Global Stats (Stats globales)**
   - Combined top scorers and assisters table
   - Sortable columns: Goals, Assists, Matches, Minutes, G/90, A/90
   - Column visibility controls for advanced fields
   - Favorites filtering and highlighting

2. **Player Form & Streaks (Forme & séries)**
   - Player search with debouncing
   - Last 5 or 10 games analysis
   - Performance chart showing goals/assists trend
   - Streak detection (goal/assist streaks)
   - Score and assist probability calculations

3. **Today's Matches (Matchs du jour)**
   - Fixtures by date with date picker
   - Top scorers and assisters for each match
   - In-form players with probability indicators
   - Match status (upcoming, live, finished)

### Core Features

- **Secure API Proxy**: All API calls go through `/api/football/*` - API key never exposed to frontend
- **Server-side Caching**: 10-60 minute TTL depending on endpoint type
- **Rate Limiting**: Daily call counter with 7,500 limit
- **Usage Monitoring**: Widget showing API calls consumed with warnings at 80% and 95%
- **Competition Tiers**: Tier 1 (major leagues) and Tier 2 (additional leagues with confirmation)
- **Favorites System**: Save players/teams to localStorage
- **Dark Mode**: Full dark/light theme support
- **i18n**: English and French translations

### Probability System

Transparent probability calculations using weighted formulas:

```
scoreProb = clamp(0.4*goalsPer90 + 0.3*(goalsLastN/N) + 0.2*teamAttackFactor + 0.1*opponentDefenseWeakness)
assistProb = clamp(0.5*assistsPer90 + 0.3*(assistsLastN/N) + 0.2*teamAttackFactor)
```

- Home advantage: +3% boost
- Insufficient data detection when minutes < 270 or matches < 3

## Setup

### Prerequisites

- Node.js 18+
- API-Football account with API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variable:
   ```bash
   export API_FOOTBALL_KEY=your_api_key_here
   ```
   Or add to Replit Secrets as `API_FOOTBALL_KEY`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5000

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand (global), TanStack React Query (server state)
- **Routing**: Wouter
- **Charts**: Recharts
- **Backend**: Express.js with TypeScript
- **Caching**: node-cache for server-side request caching
- **i18n**: Custom dictionary-based EN/FR translations

## API Endpoints

All endpoints are proxied through the backend:

- `GET /api/football/usage` - Get API usage stats
- `GET /api/football/stats/merged` - Combined top scorers/assisters
- `GET /api/football/players/search` - Search players
- `GET /api/football/players/form/:id` - Player form data
- `GET /api/football/players/stats/:id` - Player season stats
- `GET /api/football/fixtures/date` - Fixtures by date with player data

## Configuration

### Competitions (src/config/competitions.ts)
- Tier 1: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League
- Tier 2: Portuguese, Dutch, Belgian, Turkish leagues, MLS, Brazilian, Argentine leagues

### API Limits (src/config/apiLimits.ts)
- Daily limit: 7,500 calls
- Warning threshold: 80%
- Critical threshold: 95%

## Deployment

The app is ready to deploy on Replit:

1. Set `API_FOOTBALL_KEY` in Secrets
2. Click Deploy/Publish

## Security

- API key stored only in environment variables
- Server-side API key injection via headers
- Frontend never has access to API credentials
- All external API calls proxied through backend
