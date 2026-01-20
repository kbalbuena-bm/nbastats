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
