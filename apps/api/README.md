# API Backend

This is the backend API for the NBA Stats application. It fetches data directly from the official NBA Stats API.

## No Database Required! 🎉

This API is a **proxy** that fetches data from the NBA's official API. No database setup needed!

## Environment Variables

Create a `.env` file in this directory (`apps/api/.env`) with:

```
PORT=4000
NODE_ENV=development
```

That's it! No database connection string needed.

## Available Endpoints

### GET /
Returns API information and available endpoints

### GET /api/health
Health check endpoint

### GET /api/players/all
Get all current NBA players

**Example response:**
```json
{
  "success": true,
  "data": [...array of players...],
  "headers": ["PERSON_ID", "DISPLAY_FIRST_LAST", "ROSTERSTATUS", ...],
  "count": 530
}
```

### GET /api/player/:playerId/career
Get player career statistics

**Example:** `/api/player/2544/career` (LeBron James)

**Response includes:**
- Regular season stats by year
- Playoff stats by year
- Career totals

### GET /api/player/:playerId/info
Get player basic information (height, weight, position, etc.)

**Example:** `/api/player/2544/info` (LeBron James)

### GET /api/player/:playerId/detail
Get complete player profile data (info, career stats, game log, shot chart, splits)

**Example:** `/api/player/2544/detail` (LeBron James)

### GET /api/player/:playerId/valuation
Get player valuation data including stock index, fair market value, and surplus value.

**Example:** `/api/player/2544/valuation` (LeBron James)

**Response includes:**
- `stockIndex`: 0-100 score based on surplus value percentile
- `fairAAV`: Calculated fair market annual value
- `actualAAV`: Actual salary (if available in contracts.csv)
- `surplusValue`: fairAAV - actualAAV
- `trajectory`: 'rising', 'stable', 'declining', or 'unknown'
- `explanationBreakdown`: Detailed breakdown of how the valuation was calculated

### GET /api/team/:teamId/roster
Get team roster for current season

**Example:** `/api/team/1610612747/roster` (Lakers)

## Common Player IDs

- LeBron James: `2544`
- Stephen Curry: `201939`
- Kevin Durant: `201142`
- Giannis Antetokounmpo: `203507`

## Available Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server

## How It Works

This API acts as a proxy to the NBA Stats API:

```
Your Frontend → Your API → NBA Stats API → Response
```

**Why a proxy?**
- Handles CORS issues
- Can add caching later
- Can transform data format
- Can add your own endpoints
- Keeps NBA API logic separate from frontend

## Player Valuation Model

The valuation module computes a hypothetical "stock value" for NBA players based on performance and salary data.

### How Players Are Valued

#### 1. Impact Score Calculation
The Impact Score is calculated using per-36-minute stats with the following weights:

| Stat | Weight |
|------|--------|
| Points Per 36 | 35% |
| Assists Per 36 | 20% |
| Rebounds Per 36 | 15% |
| Steals Per 36 | 10% |
| Blocks Per 36 | 10% |
| True Shooting % (scaled) | 10% |
| Turnover Penalty | -5% per TO/36 |

#### 2. Recency Weighting
The model uses a 3-year weighted average with recency bias:
- Current season: 60% weight
- Previous season: 30% weight
- 2 seasons ago: 10% weight

#### 3. Age Adjustment
An age factor is applied based on typical NBA career trajectories:
- **Peak ages (26-28)**: No adjustment (1.0x)
- **Under 26**: +0.5% per year (potential upside)
- **Over 28**: -1.0% per year (decline risk)
- **Maximum adjustment**: ±10%

#### 4. Fair Market AAV
The adjusted Impact Score is converted to a Fair Market Annual Average Value (AAV) using linear calibration:
- Median salary ($8.5M) anchored at median impact score (8.0)
- Top salary ($55M) anchored at top impact score (25.0)

#### 5. Stock Index (0-100)
The Stock Index is calculated as:
- Percentile rank of surplus value (Fair AAV - Actual AAV) across all players
- Trajectory bonus: +5 for rising, -5 for declining

### Stock Index Interpretation
- **80-100**: Elite Value - significantly underpaid relative to performance
- **60-79**: Great Value - moderately underpaid
- **40-59**: Fair Value - paid approximately market rate
- **20-39**: Overpaid - paid above market value
- **0-19**: Poor Value - significantly overpaid

## Updating Contracts Data

The contracts data is stored in `apps/api/data/contracts.csv` with the following format:

```csv
nba_player_id,player_name,season,salary
2544,LeBron James,2024-25,51415938
203999,Nikola Jokic,2024-25,51415938
```

### To Update Contracts:
1. Open `apps/api/data/contracts.csv`
2. Add new rows with player salary data
3. Format: `nba_player_id,player_name,season,salary`
4. The salary should be the full annual value (not abbreviated)
5. Restart the API server for changes to take effect

### Finding Player IDs:
- Use the `/api/players/all` endpoint to get current player IDs
- Or check the NBA Stats website URL when viewing a player

### Data Sources for Salaries:
- [Spotrac](https://www.spotrac.com/nba/)
- [Basketball Reference](https://www.basketball-reference.com/contracts/)
- [HoopsHype](https://hoopshype.com/salaries/)

## Running Valuation Tests

```bash
cd apps/api
npx tsx src/valuation.test.ts
```

This runs 49 unit tests covering:
- True Shooting Percentage calculations
- Per-36 stat scaling
- Impact Score breakdown
- Weighted multi-season scoring
- Age factor adjustments
- Fair AAV calibration
- Stock Index calculation
- Trajectory determination
