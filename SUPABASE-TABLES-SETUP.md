# 🗄️ Create Database Tables in Supabase

## Step 1: Go to Your Supabase Dashboard

1. Open https://supabase.com
2. Log in
3. Click on your `nbastats` project

## Step 2: Create the `favorite_players` Table

1. Click **"Table Editor"** in the left sidebar
2. Click **"Create a new table"**
3. Fill in:
   - **Name:** `favorite_players`
   - **Description:** "Stores users' favorite NBA players"
   - **Enable Row Level Security (RLS):** ✅ CHECK THIS BOX

4. Add these columns (click "+ Add column" for each):

| Column Name | Type | Default Value | Primary | Nullable |
|-------------|------|---------------|---------|----------|
| `id` | int8 | (auto) | ✅ Yes | No |
| `created_at` | timestamptz | now() | No | No |
| `user_id` | uuid | auth.uid() | No | No |
| `player_id` | text | (none) | No | No |
| `player_name` | text | (none) | No | No |
| `team` | text | (none) | No | Yes |

5. Click **"Save"**

## Step 3: Create the `favorite_teams` Table

1. Click **"Create a new table"** again
2. Fill in:
   - **Name:** `favorite_teams`
   - **Description:** "Stores users' favorite NBA teams"
   - **Enable Row Level Security (RLS):** ✅ CHECK THIS BOX

3. Add these columns:

| Column Name | Type | Default Value | Primary | Nullable |
|-------------|------|---------------|---------|----------|
| `id` | int8 | (auto) | ✅ Yes | No |
| `created_at` | timestamptz | now() | No | No |
| `user_id` | uuid | auth.uid() | No | No |
| `team_id` | text | (none) | No | No |
| `team_name` | text | (none) | No | No |

4. Click **"Save"**

## Step 4: Set Up Row Level Security (RLS) Policies

This ensures users can only see/edit their own favorites!

### For `favorite_players` table:

1. Click on `favorite_players` table
2. Click **"RLS"** tab (or **"Policies"**)
3. Click **"New Policy"**
4. Click **"Create policy from template"**
5. Choose **"Enable read access for users based on user_id"**
6. Policy name: `Users can view their own favorites`
7. Click **"Review"** then **"Save policy"**

8. Click **"New Policy"** again
9. Choose **"Enable insert for users based on user_id"**
10. Policy name: `Users can add favorites`
11. Click **"Review"** then **"Save policy"**

12. Click **"New Policy"** again
13. Choose **"Enable delete for users based on user_id"**
14. Policy name: `Users can delete their own favorites`
15. Click **"Review"** then **"Save policy"**

### For `favorite_teams` table:

Repeat the same 3 policies for `favorite_teams`:
1. Read policy
2. Insert policy
3. Delete policy

---

## ✅ You're Done!

Your database is now set up with:
- ✅ Two tables (`favorite_players` and `favorite_teams`)
- ✅ Security rules (users can only see their own data)
- ✅ Auto-generated IDs and timestamps

---

## Quick SQL Alternative (For Advanced Users)

If you prefer, you can run this SQL instead (click **"SQL Editor"** in Supabase):

```sql
-- Create favorite_players table
CREATE TABLE favorite_players (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT
);

-- Enable RLS
ALTER TABLE favorite_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_players
CREATE POLICY "Users can view their own favorite players"
  ON favorite_players FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite players"
  ON favorite_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite players"
  ON favorite_players FOR DELETE
  USING (auth.uid() = user_id);

-- Create favorite_teams table
CREATE TABLE favorite_teams (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE favorite_teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_teams
CREATE POLICY "Users can view their own favorite teams"
  ON favorite_teams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite teams"
  ON favorite_teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite teams"
  ON favorite_teams FOR DELETE
  USING (auth.uid() = user_id);
```

Click **"Run"** and you're done!

---

Once you've created the tables, come back and say "Tables are ready!" and I'll continue building the favorites features! 🚀

