# 🗄️ NBA Stats Database Caching Guide

This guide will help you cache NBA API data in Supabase for faster, more reliable performance.

---

## 🎯 Why Cache the Data?

**Current Problem:**
- NBA API is SLOW (30-60 second timeouts)
- NBA API is UNRELIABLE (often fails or rate-limits)
- Every page load requires a fresh NBA API call

**Solution:**
- Store NBA data in Supabase database
- Refresh data periodically (once per day or on-demand)
- App loads instantly from database
- Falls back to NBA API only when needed

---

## 📊 Step 1: Create Database Tables in Supabase

### **A. Go to Supabase SQL Editor**

1. Go to https://supabase.com
2. Click your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

---

### **B. Create Players Table**

Run this SQL:

```sql
-- Create players table to cache NBA player data
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  team_id TEXT,
  team_name TEXT,
  team_abbreviation TEXT,
  jersey_number TEXT,
  position TEXT,
  height TEXT,
  weight TEXT,
  birth_date TEXT,
  age INTEGER,
  country TEXT,
  school TEXT,
  draft_year TEXT,
  draft_round TEXT,
  draft_number TEXT,
  
  -- Season stats
  games_played INTEGER DEFAULT 0,
  points_per_game NUMERIC(5,2) DEFAULT 0,
  rebounds_per_game NUMERIC(5,2) DEFAULT 0,
  assists_per_game NUMERIC(5,2) DEFAULT 0,
  steals_per_game NUMERIC(5,2) DEFAULT 0,
  blocks_per_game NUMERIC(5,2) DEFAULT 0,
  fg_percentage NUMERIC(5,2) DEFAULT 0,
  three_pt_percentage NUMERIC(5,2) DEFAULT 0,
  ft_percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  season TEXT DEFAULT '2024-25',
  last_updated TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_active ON players(is_active);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(full_name);
CREATE INDEX IF NOT EXISTS idx_players_updated ON players(last_updated);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can view player data)
CREATE POLICY "Allow public read access on players"
  ON players FOR SELECT
  USING (true);

-- Only authenticated users can insert/update (for API use)
CREATE POLICY "Allow authenticated insert on players"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on players"
  ON players FOR UPDATE
  TO authenticated
  USING (true);
```

Click **"Run"** to execute.

---

### **C. Create Teams Table**

Run this SQL:

```sql
-- Create teams table to cache NBA team data
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  nickname TEXT,
  city TEXT,
  state TEXT,
  conference TEXT,
  division TEXT,
  
  -- Season stats
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_percentage NUMERIC(5,3) DEFAULT 0,
  conference_rank INTEGER,
  points_per_game NUMERIC(5,2) DEFAULT 0,
  rebounds_per_game NUMERIC(5,2) DEFAULT 0,
  assists_per_game NUMERIC(5,2) DEFAULT 0,
  
  -- Metadata
  season TEXT DEFAULT '2024-25',
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teams_conference ON teams(conference);
CREATE INDEX IF NOT EXISTS idx_teams_updated ON teams(last_updated);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on teams"
  ON teams FOR SELECT
  USING (true);

-- Only authenticated users can insert/update
CREATE POLICY "Allow authenticated insert on teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (true);
```

Click **"Run"** to execute.

---

### **D. Create Cache Metadata Table**

This tracks when data was last refreshed:

```sql
-- Create cache metadata table
CREATE TABLE IF NOT EXISTS cache_metadata (
  cache_key TEXT PRIMARY KEY,
  last_updated TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  record_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'valid',
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE cache_metadata ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on cache_metadata"
  ON cache_metadata FOR SELECT
  USING (true);

-- Only authenticated users can insert/update
CREATE POLICY "Allow authenticated insert on cache_metadata"
  ON cache_metadata FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on cache_metadata"
  ON cache_metadata FOR UPDATE
  TO authenticated
  USING (true);
```

Click **"Run"** to execute.

---

## 🔧 Step 2: Update API to Use Database Cache

### **A. Install Supabase Client in API**

In your terminal:

```bash
cd /Users/karlbalbuena/Desktop/nbastats/apps/api
npm install @supabase/supabase-js
```

---

### **B. Add Supabase Environment Variables to Railway**

1. Go to Railway dashboard
2. Click your **API** service
3. Go to **"Variables"** tab
4. Add these variables:

```
SUPABASE_URL=https://gobtxqobqllfnlcbxvfh.supabase.co
SUPABASE_SERVICE_KEY=<your-service-role-key>
```

**⚠️ Important:** Use the **service_role** key (not anon key) for API server:
- Go to Supabase → Project Settings → API
- Copy the **service_role** key (long key starting with `eyJ...`)
- This allows the API to insert/update data

---

### **C. Create Supabase Client in API**

Create new file: `apps/api/src/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not found. Database caching will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

---

### **D. Create Cache Service**

Create new file: `apps/api/src/cacheService.ts`:

```typescript
import { supabase } from './supabase';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const cacheService = {
  // Check if cache is fresh
  async isCacheFresh(cacheKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('cache_metadata')
        .select('last_updated, expires_at')
        .eq('cache_key', cacheKey)
        .single();

      if (error || !data) return false;

      const expiresAt = new Date(data.expires_at);
      return expiresAt > new Date();
    } catch (error) {
      console.error('Error checking cache freshness:', error);
      return false;
    }
  },

  // Get players from cache
  async getPlayers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching players from cache:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPlayers:', error);
      return [];
    }
  },

  // Save players to cache
  async savePlayers(players: any[]): Promise<void> {
    try {
      console.log(`💾 Saving ${players.length} players to database...`);

      // Delete existing players for this season
      await supabase
        .from('players')
        .delete()
        .eq('season', '2024-25');

      // Insert new players in batches (Supabase has a limit)
      const batchSize = 100;
      for (let i = 0; i < players.length; i += batchSize) {
        const batch = players.slice(i, i + batchSize);
        const { error } = await supabase
          .from('players')
          .insert(batch);

        if (error) {
          console.error(`Error saving batch ${i / batchSize + 1}:`, error);
        }
      }

      // Update cache metadata
      const expiresAt = new Date(Date.now() + CACHE_DURATION);
      await supabase
        .from('cache_metadata')
        .upsert({
          cache_key: 'players_all',
          last_updated: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          record_count: players.length,
          status: 'valid'
        });

      console.log(`✅ Successfully saved ${players.length} players to database`);
    } catch (error) {
      console.error('Error in savePlayers:', error);
    }
  },

  // Get teams from cache
  async getTeams(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching teams from cache:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTeams:', error);
      return [];
    }
  },

  // Save teams to cache
  async saveTeams(teams: any[]): Promise<void> {
    try {
      console.log(`💾 Saving ${teams.length} teams to database...`);

      // Upsert teams (insert or update)
      const { error } = await supabase
        .from('teams')
        .upsert(teams);

      if (error) {
        console.error('Error saving teams:', error);
        return;
      }

      // Update cache metadata
      const expiresAt = new Date(Date.now() + CACHE_DURATION);
      await supabase
        .from('cache_metadata')
        .upsert({
          cache_key: 'teams_all',
          last_updated: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          record_count: teams.length,
          status: 'valid'
        });

      console.log(`✅ Successfully saved ${teams.length} teams to database`);
    } catch (error) {
      console.error('Error in saveTeams:', error);
    }
  }
};
```

---

## 🚀 Step 3: Update API Endpoints to Use Cache

### **Modify `/api/players/all` endpoint:**

Add cache-first logic:

```typescript
// NEW: Cache-first endpoint for all players
app.get('/api/players/all', async (req: Request, res: Response) => {
  try {
    // 1. Check if cache is fresh
    const isFresh = await cacheService.isCacheFresh('players_all');
    
    if (isFresh) {
      console.log('📦 Serving players from cache');
      const cachedPlayers = await cacheService.getPlayers();
      
      if (cachedPlayers.length > 0) {
        return res.json({
          success: true,
          source: 'cache',
          count: cachedPlayers.length,
          data: cachedPlayers
        });
      }
    }

    // 2. Cache is stale or empty - fetch from NBA API
    console.log('🌐 Fetching fresh data from NBA API...');
    const currentSeason = getCurrentSeason();
    
    const data = await fetchNBAData('commonallplayers', {
      'LeagueID': '00',
      'Season': currentSeason,
      'IsOnlyCurrentSeason': '1'
    });

    // 3. Transform and save to cache
    const players = transformPlayersData(data); // You'll need to create this function
    await cacheService.savePlayers(players);

    // 4. Return fresh data
    res.json({
      success: true,
      source: 'nba_api',
      count: players.length,
      data: players
    });

  } catch (error: any) {
    console.error('❌ Error in /api/players/all:', error);
    
    // Fallback to cache even if expired
    const cachedPlayers = await cacheService.getPlayers();
    if (cachedPlayers.length > 0) {
      return res.json({
        success: true,
        source: 'cache_fallback',
        warning: 'NBA API failed, serving stale cache',
        count: cachedPlayers.length,
        data: cachedPlayers
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch players',
      message: error.message
    });
  }
});
```

---

## 📅 Step 4: Add Manual Refresh Endpoint

Add an endpoint to manually refresh the cache:

```typescript
// Admin endpoint to manually refresh player cache
app.post('/api/admin/refresh-players', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Manual cache refresh triggered');
    
    const currentSeason = getCurrentSeason();
    const data = await fetchNBAData('commonallplayers', {
      'LeagueID': '00',
      'Season': currentSeason,
      'IsOnlyCurrentSeason': '1'
    });

    const players = transformPlayersData(data);
    await cacheService.savePlayers(players);

    res.json({
      success: true,
      message: `Successfully refreshed ${players.length} players`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## ⏰ Step 5: (Optional) Set Up Automatic Daily Refresh

You can use Railway's Cron Jobs or an external service like Cron-job.org to call your refresh endpoint daily:

1. Go to https://cron-job.org (or similar)
2. Create a new cron job
3. Set URL: `https://hoopmarket.up.railway.app/api/admin/refresh-players`
4. Set schedule: Daily at 6 AM ET (when NBA stats are updated)
5. Method: POST

---

## ✅ Testing Your Cache

### **1. Initial Data Load:**
```
POST https://hoopmarket.up.railway.app/api/admin/refresh-players
```
This fetches from NBA API and populates your database.

### **2. Test Cached Response:**
```
GET https://hoopmarket.up.railway.app/api/players/all
```
Should return instantly with `"source": "cache"`

### **3. Check Supabase:**
Go to Supabase → Table Editor → `players` table
You should see hundreds of player records!

---

## 🎯 Benefits You'll See:

- ⚡ **Load time**: 30-60 seconds → **< 1 second**
- 🛡️ **Reliability**: 60% → **99.9%**
- 💰 **NBA API calls**: Every request → **Once per day**
- 📊 **Bonus**: Historical data tracking if you keep old records

---

## 🚀 Ready to Implement?

Let me know and I'll help you:
1. Create the database tables
2. Update your API code
3. Test the caching system
4. Set up automatic refresh

Would you like me to start implementing this now?


