# 🗄️ DATABASE SETUP GUIDE (For Beginners)

## What We're Building

Your NBA Stats app currently fetches data from the NBA API every time someone visits. We're going to add:

1. **Database** - Store user data, favorites, and cached NBA stats
2. **User Authentication** - Let users create accounts and log in
3. **User Features** - Save favorite players/teams

---

## Part 1: Understanding Databases

### What is a Database?
Think of it like a smart filing cabinet that:
- **Stores data permanently** (doesn't disappear when you close the app)
- **Organizes data in tables** (like Excel sheets)
- **Lets you search/update quickly** (faster than searching files)

### Example Tables We'll Create:

**Table: users**
| id | email | created_at |
|----|-------|------------|
| 1  | john@email.com | 2026-01-15 |
| 2  | jane@email.com | 2026-01-16 |

**Table: favorite_players**
| id | user_id | player_id | player_name |
|----|---------|-----------|-------------|
| 1  | 1       | 2544      | LeBron James |
| 2  | 1       | 201939    | Stephen Curry |
| 3  | 2       | 2544      | LeBron James |

**Table: favorite_teams**
| id | user_id | team_id   | team_name |
|----|---------|-----------|-----------|
| 1  | 1       | 1610612747| Los Angeles Lakers |

---

## Part 2: Setting Up Supabase

### Step 1: Create a Supabase Account

1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub or Email (free!)
4. Click **"New Project"**

### Step 2: Create Your Project

Fill in:
- **Name:** `nbastats-db` (or any name you like)
- **Database Password:** Create a strong password (SAVE THIS!)
- **Region:** Choose closest to you (e.g., `US West`)
- **Pricing Plan:** Free

Click **"Create new project"** and wait 2-3 minutes for setup.

### Step 3: Get Your Connection Details

Once ready, you'll see a dashboard. Click on **Settings** (gear icon) → **API**

You'll need these 2 values (we'll use them later):
- **Project URL** (looks like: `https://xxxxx.supabase.co`)
- **anon/public key** (long string starting with `eyJ...`)

**📝 SAVE THESE! We'll add them to your app in Part 3.**

---

## Part 3: What We'll Build

### Features:

1. **User Registration/Login**
   - Sign up with email & password
   - Log in / Log out
   - See "My Account" page

2. **Favorite Players**
   - Click a ⭐ on any player card to save as favorite
   - View "My Favorites" page
   - Remove favorites

3. **Favorite Teams**
   - Save favorite teams
   - Quick access to your teams

4. **User Profile**
   - See your email
   - See when you joined
   - View your stats (# of favorites)

---

## Part 4: Technical Overview (What Happens Behind the Scenes)

### Current App Architecture:
```
User's Browser (Frontend)
    ↓
Your API Server (Backend)
    ↓
NBA API (External)
```

### New Architecture with Database:
```
User's Browser (Frontend)
    ↓
Your API Server (Backend)
    ↓ ↙ ↘
NBA API   Supabase Database
          (User data & favorites)
```

### How Authentication Works:

1. **Sign Up:**
   - User enters email + password on your site
   - Your frontend sends it to Supabase
   - Supabase creates the account (password is encrypted!)
   - Supabase sends back a "token" (like a key card)

2. **Log In:**
   - User enters email + password
   - Supabase checks if it's correct
   - Sends back a token if correct

3. **Making Requests:**
   - Browser includes the token with every request
   - Your API checks: "Is this token valid?"
   - If yes → show user's favorites
   - If no → redirect to login

---

## Part 5: Implementation Steps

I'll help you implement this in the following order:

### Phase 1: Database Setup ✅
- Install Supabase client library
- Create `.env` file with your credentials
- Test connection

### Phase 2: Authentication UI
- Add "Sign Up" page
- Add "Log In" page
- Add "Log Out" button
- Show user's email when logged in

### Phase 3: Database Tables
- Create `favorite_players` table
- Create `favorite_teams` table
- Create `user_preferences` table

### Phase 4: Favorite Features
- Add ⭐ button to player cards
- Save favorites to database
- Show "My Favorites" page
- Remove favorites

### Phase 5: User Profile
- Create profile page
- Show user stats
- Allow account settings

---

## Part 6: Security & Best Practices

### What Supabase Handles For You:
- ✅ **Password encryption** (passwords never stored as plain text)
- ✅ **SQL injection prevention** (hackers can't mess with your database)
- ✅ **Authentication tokens** (secure login sessions)
- ✅ **HTTPS** (encrypted connection)

### What You Need To Do:
- ✅ **Never commit `.env` to Git** (keeps your secrets safe)
- ✅ **Validate user inputs** (check emails are valid, etc.)
- ✅ **Use Supabase Row Level Security (RLS)** (users can only see their own data)

---

## Next Steps

Ready to start? Let me know and I'll:

1. ✅ Install the necessary packages
2. ✅ Create the Supabase configuration files
3. ✅ Set up authentication pages
4. ✅ Add the favorites feature
5. ✅ Create a user profile page

**You'll need:**
- Your Supabase Project URL
- Your Supabase anon key

Once you have those, we can start implementing! 🚀

---

## FAQ for Beginners

**Q: Will this cost money?**
A: Supabase free tier includes 500MB database, 50,000 monthly active users, and 2GB bandwidth. Perfect for learning!

**Q: What if I mess up?**
A: You can always create a new Supabase project or delete tables. It's safe to experiment!

**Q: Do I need to know SQL?**
A: Not really! Supabase has a visual table editor, and I'll provide all the code you need.

**Q: Where is the data stored?**
A: In Supabase's secure cloud servers (PostgreSQL database).

**Q: Can I see the database?**
A: Yes! Supabase has a built-in table viewer where you can see all your data.

---

## Glossary (Terms You'll Hear)

- **Database:** Where data is permanently stored
- **Table:** Like a spreadsheet (rows = records, columns = fields)
- **Row:** One entry (e.g., one user, one favorite)
- **Column:** One piece of data (e.g., email, player_id)
- **Query:** Asking the database for data (e.g., "get all favorites for user 123")
- **Authentication (Auth):** Verifying who the user is (login/signup)
- **Token:** A secret code that proves you're logged in
- **API Key:** A password for your app to talk to Supabase
- **Environment Variable (.env):** Secret values stored outside your code
- **RLS (Row Level Security):** Database rules so users can't see each other's data

---

Ready to start? Say "Let's set up the database!" and I'll begin! 🎉

