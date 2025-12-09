# Football Statistics App - Design Guidelines

## Design Approach

**Selected Approach**: Design System (Utility-Focused)  
**Primary Reference**: Material Design with inspiration from FotMob, SofaScore, and ESPN for sports-specific patterns  
**Rationale**: Data-heavy application requiring efficient information display, clear hierarchies, and consistent patterns for statistics comparison

## Core Design Principles

1. **Data First**: Statistics and numbers take visual priority
2. **Scan-ability**: Users quickly compare players/matches without effort
3. **Context Clarity**: Always show what competition/season/date is selected
4. **Progressive Disclosure**: Surface key stats first, details on demand
5. **Trust & Transparency**: Probability calculations clearly explained

## Typography

**Font Stack**: 
- Primary: Inter (Google Fonts) - excellent for tables and data
- Monospace: JetBrains Mono - for numbers, scores, statistics

**Hierarchy**:
- Page titles: text-2xl md:text-3xl font-bold
- Section headers: text-xl font-semibold
- Table headers: text-sm font-medium uppercase tracking-wide
- Statistics (large numbers): text-3xl md:text-4xl font-bold tabular-nums
- Body text: text-base
- Labels/metadata: text-sm text-gray-400
- Small stats: text-xs

## Layout System

**Spacing Primitives**: Use tailwind units of 2, 4, 6, 8, 12, 16  
- Component padding: p-4 md:p-6
- Section spacing: space-y-6 md:space-y-8
- Card gaps: gap-4 md:gap-6
- Table cell padding: p-3 md:p-4

**Grid Structure**:
- Desktop: 12-column grid with max-w-7xl container
- Tablet: 8-column, responsive breakpoints at md: and lg:
- Mobile: Single column with horizontal scroll for wide tables

## Component Library

### Navigation
- Fixed top bar with competition selector, date picker, language/theme toggles
- Breadcrumb showing: Competition > Season > Current Page
- Usage widget: small pill showing "1,234 / 7,500 calls" in top-right corner

### Tables (Core Component)
- Sticky headers on scroll
- Zebra striping for row distinction (subtle, dark-mode optimized)
- Sortable columns: arrow indicators, active column highlighted
- Column visibility menu: checkboxes dropdown in table toolbar
- Row hover: subtle background shift
- Mobile: horizontal scroll with sticky first column (player name)
- Empty states: centered icon + message
- Loading: skeleton rows matching table structure

### Cards
- Match cards: team badges (48x48), score/time prominent, compact player stats below
- Player cards: photo circle (64x64), name/team, key stats in grid (2x2)
- Stat cards: large number top, label below, trend indicator (↑↓)

### Data Visualization
- Line charts: player form over last N matches (goals/assists as dual lines)
- Bar charts: comparing stats across players (horizontal bars for space efficiency)
- Probability indicators: horizontal progress bars with percentage label
- Use green tints for positive metrics, amber for warnings, red for alerts

### Filters & Controls
- Competition selector: dropdown with tier badges (Tier 1/Tier 2)
- Date picker: calendar icon, shows selected date clearly
- Toggle switches: EN/FR, Dark/Light, Favorites only
- Period selector: segmented control (5 games / 10 games)
- Search: debounced input with search icon, clear button appears when typing

### Status & Feedback
- Loading skeletons: match table structure exactly
- Error states: retry button + error message in card format
- Warning banner (80% API limit): amber with dismiss option
- Throttle banner (95% limit): red, persistent, blocks heavy actions
- Empty favorites: call-to-action to add first favorite
- "Data insuffisante": gray card with info icon + explanation

### Favorites System
- Star icon (outline/filled) on hover over player/team rows
- Filter toolbar: "Show favorites only" checkbox + "Highlight favorites" toggle
- Highlighted favorites: subtle left border accent

### Probability Display
- Score/Assist probability: side-by-side progress bars
- Percentage: bold, displayed at bar end
- Factors breakdown: collapsible section showing calculation weights
- Insufficient data: grayed out with tooltip explaining why

## Page-Specific Layouts

### Stats Globales
- Top: filter bar (competition, season, column visibility)
- Main: large data table, full width
- Right sidebar (desktop): quick stats cards (total goals, top scorer, etc.)

### Forme & Séries
- Top: player search bar (prominent, center-aligned)
- Left (desktop): player detail card with photo, stats summary
- Center: performance chart + last N matches table
- Period toggle above chart

### Matchs du Jour
- Top: date selector (prominent, centered)
- Grid: match cards (2 columns desktop, 1 mobile)
- Each card: match info → top scorers → top assisters → in-form players (collapsible)

## Dark Mode Strategy

**Background Layers**:
- Base: bg-gray-950
- Cards/tables: bg-gray-900
- Elevated (modals/dropdowns): bg-gray-800
- Borders: border-gray-800

**Text Contrast**:
- Primary: text-gray-100
- Secondary: text-gray-400
- Muted/labels: text-gray-500

**Accent Colors** (use sparingly):
- Primary actions: blue-500/600
- Success/positive: green-500
- Warning: amber-500
- Error: red-500
- Probabilities: use gradient (low: gray → high: green)

## Responsive Behavior

**Mobile Priority**:
- Tables: horizontal scroll with position sticky on player name column
- Match cards: stack vertically
- Filters: collapse into bottom sheet or hamburger menu
- Large stats: reduce font size responsively
- Charts: maintain aspect ratio, reduce height on mobile

## Images

No hero images required - this is a data-focused application. Use:
- Team badges: 32x32 to 64x64 depending on context (fetch from API)
- Player photos: circular, 64x64 for cards, 48x48 for table rows
- Competition logos: 24x24 next to competition name in selectors
- Placeholder: gray circle with initials if image unavailable