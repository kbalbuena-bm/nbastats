# 🚀 Supabase Setup Guide (For Beginners)

Supabase is a cloud database service - think of it like Google Drive, but for databases. It's **FREE** and much easier than setting up a local database!

## Why Supabase?

- ✅ **No Docker needed** - Everything runs in the cloud
- ✅ **Free tier** - Generous limits, perfect for learning
- ✅ **Beautiful dashboard** - See your data visually
- ✅ **Built-in features** - Authentication, storage, real-time updates
- ✅ **PostgreSQL** - Same database the pros use

---

## Step-by-Step Setup (5 minutes)

### Step 1: Create a Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or email
4. Verify your email if needed

### Step 2: Create a New Project

1. Click **"New Project"**
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name:** `nbastats` (or whatever you like)
   - **Database Password:** Create a strong password (SAVE THIS! You'll need it)
   - **Region:** Choose closest to you (e.g., "US West" if you're in California)
   - **Pricing Plan:** Free
4. Click **"Create new project"**
5. Wait 2-3 minutes for your database to be created ☕

### Step 3: Get Your Database Connection String

1. Once your project is ready, click **"Project Settings"** (gear icon ⚙️ in the bottom left)
2. Click **"Database"** in the left sidebar
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab
5. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijk.supabase.co:5432/postgres
   ```
6. **Copy this entire string**
7. Replace `[YOUR-PASSWORD]` with the password you created in Step 2

**Example:**
If your password is `MySecure123!` and your project ref is `abcdefghijk`, your string will be:
```
postgresql://postgres:MySecure123!@db.abcdefghijk.supabase.co:5432/postgres
```

### Step 4: Add to Your Project

1. Open your terminal
2. Navigate to your project:
   ```bash
   cd ~/Desktop/nbastats
   ```
3. Create the environment file:
   ```bash
   cat > apps/api/.env << 'EOF'
   DATABASE_URL="PASTE_YOUR_CONNECTION_STRING_HERE"
   PORT=4000
   NODE_ENV=development
   EOF
   ```
4. **Open** `apps/api/.env` in a text editor
5. **Replace** `PASTE_YOUR_CONNECTION_STRING_HERE` with your actual connection string from Step 3
6. **Save** the file

**Your `apps/api/.env` should look like:**
```env
DATABASE_URL="postgresql://postgres:MySecure123!@db.abcdefghijk.supabase.co:5432/postgres"
PORT=4000
NODE_ENV=development
```

### Step 5: Test the Connection

1. Make sure you've installed packages:
   ```bash
   npm install
   ```
2. Generate Prisma client:
   ```bash
   cd apps/api
   npm run prisma:generate
   cd ../..
   ```
3. Start your API:
   ```bash
   npm run dev:api
   ```
4. Open http://localhost:4000/api/health in your browser
5. You should see:
   ```json
   {
     "status": "healthy",
     "database": "connected"
   }
   ```

✅ **Success!** Your API is now connected to Supabase!

---

## 🎯 Using the Supabase Dashboard

### Viewing Your Data

1. Go to https://supabase.com
2. Open your project
3. Click **"Table Editor"** in the sidebar
4. Here you can:
   - See all your tables
   - Add data manually
   - Edit records
   - Delete data

### Running SQL Queries

1. Click **"SQL Editor"** in the sidebar
2. Write SQL queries to interact with your database
3. Click "Run" to execute

**Example query:**
```sql
SELECT * FROM "Player";
```

---

## 🗄️ Creating Your First Table

### Option 1: Using Prisma (Recommended)

1. Open `apps/api/prisma/schema.prisma`
2. Uncomment the `Player` model:
   ```prisma
   model Player {
     id        Int      @id @default(autoincrement())
     name      String
     team      String
     position  String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```
3. Run migration:
   ```bash
   cd apps/api
   npm run prisma:migrate
   ```
4. Name it: `add_player_model`
5. Press Enter

✅ Your table is created in Supabase!

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project
2. Click **"Table Editor"**
3. Click **"New Table"**
4. Fill in:
   - **Name:** `Player`
   - Add columns: `name` (text), `team` (text), `position` (text)
5. Click "Save"

---

## 💡 Supabase vs Local Database

| Feature | Supabase ✅ | Local (Docker) |
|---------|------------|----------------|
| Setup time | 5 minutes | 15 minutes |
| Requires Docker | No | Yes |
| Access anywhere | Yes | No (only your computer) |
| Visual dashboard | Beautiful | Need separate tools |
| Free | Yes (generous limits) | Yes |
| Internet required | Yes | No |
| Good for production | Yes | No |

---

## 🔐 Security Tips

1. **Never commit `.env` files to Git** (already in .gitignore)
2. **Don't share your database password** publicly
3. **Use Row Level Security (RLS)** in production (learn this later)
4. **Rotate passwords** if accidentally exposed

---

## 🐛 Troubleshooting

### "Can't connect to database"

**Check:**
1. Is your password correct in the `DATABASE_URL`?
2. Did you replace `[YOUR-PASSWORD]` with actual password?
3. Is your internet connection working?
4. Is the Supabase project status "Active"? (check dashboard)

**Fix:**
1. Go to Supabase dashboard
2. Get the connection string again
3. Update `apps/api/.env`
4. Restart your API: `npm run dev:api`

### "Password authentication failed"

Your password in the connection string is wrong.

**Fix:**
1. Go to Supabase > Project Settings > Database
2. Click "Reset database password"
3. Set a new password
4. Update your `.env` file with the new password

### "Database connection timed out"

**Check:**
1. Internet connection
2. Supabase isn't having downtime (check status.supabase.com)

---

## 📚 Next Steps

1. ✅ Connect to Supabase (you just did this!)
2. Create your first table using Prisma
3. Add some data through the Supabase dashboard
4. Fetch that data in your API
5. Display it in your web app
6. Learn about Supabase Auth (user login)
7. Explore Supabase Storage (file uploads)

---

## 🎓 Learn More

- **Supabase Docs:** https://supabase.com/docs
- **Prisma + Supabase:** https://www.prisma.io/docs/guides/database/supabase
- **Supabase YouTube:** Great tutorials for beginners

---

**Questions?** Re-read this guide - the answer is probably here! Or check the Supabase docs.

Happy building! 🚀

