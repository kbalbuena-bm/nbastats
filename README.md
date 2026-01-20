# 🏀 NBA Stats - Monorepo

A full-stack NBA statistics application with a Node.js backend API and Next.js frontend.

## 📁 Project Structure

```
nbastats/
├── apps/
│   ├── api/              # Backend API (Node.js + Express + Prisma)
│   │   ├── prisma/       # Database schema and migrations
│   │   ├── src/          # API source code
│   │   └── package.json  # API dependencies
│   │
│   └── web/              # Frontend (Next.js + TypeScript + Tailwind)
│       ├── src/          # Web app source code
│       │   └── app/      # Next.js pages and components
│       └── package.json  # Web dependencies
│
├── package.json          # Root monorepo configuration
├── SUPABASE-SETUP.md    # Complete Supabase setup guide
└── README.md            # This file!
```

## 🚀 Quick Start Guide

Follow these steps **exactly** in order. Copy and paste each command into your terminal.

### Step 1: Prerequisites

Before starting, you need to install these on your computer:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Choose the "LTS" version (recommended for most users)

2. **Supabase Account** (Free - Cloud Database)
   - Go to: https://supabase.com
   - Sign up for free (takes 2 minutes)
   - **See SUPABASE-SETUP.md for detailed instructions**

3. **Git** (usually pre-installed on Mac)
   - Check if installed: open Terminal and type `git --version`

### Step 2: Open Terminal

1. Open the **Terminal** app on your Mac
2. Navigate to the project folder:
   ```bash
   cd ~/Desktop/nbastats
   ```

### Step 3: Install Dependencies

Install all required packages for both apps:

```bash
npm install
```

This will take 2-5 minutes. You'll see a lot of text scrolling - that's normal!

### Step 4: Set Up Supabase Database

**Option A: Quick Method (If you already have your Supabase URL)**

Skip to Step 5 and paste your Supabase connection string.

**Option B: Detailed Setup (First time)**

Follow the complete guide in **SUPABASE-SETUP.md** - it walks you through:
1. Creating a Supabase account (2 minutes)
2. Creating a new project (2 minutes)
3. Getting your connection string (1 minute)

Don't worry, it's easier than it sounds! The guide has screenshots and explains everything.

### Step 5: Configure Environment Variables

#### For the API:

1. Create a file at `apps/api/.env`
2. Add your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
PORT=4000
NODE_ENV=development
```

**Replace the DATABASE_URL with your actual Supabase connection string!**

**Easy way to do this from Terminal:**

```bash
cat > apps/api/.env << 'EOF'
DATABASE_URL="PASTE_YOUR_SUPABASE_URL_HERE"
PORT=4000
NODE_ENV=development
EOF
```

Then open `apps/api/.env` and replace `PASTE_YOUR_SUPABASE_URL_HERE` with your real Supabase URL.

**Don't have your Supabase URL yet?** See **SUPABASE-SETUP.md** for step-by-step instructions.

#### For the Web App:

1. Create a file at `apps/web/.env.local`
2. Add this content:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Easy way to do this from Terminal:**

```bash
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
```

### Step 6: Set Up Prisma (Database Tool)

Generate Prisma client (this connects to your Supabase database):

```bash
cd apps/api
npm run prisma:generate
cd ../..
```

**What this does:** Creates TypeScript code that lets your API talk to Supabase.

**Note:** You should see "Successfully generated Prisma Client" - this means your connection works!

### Step 7: Start the Development Servers

You need to run both the API and the web app. Open **two separate Terminal windows/tabs**:

#### Terminal 1 - Start the API:

```bash
cd ~/Desktop/nbastats
npm run dev:api
```

You should see:
```
🚀 API Server is running!
📍 URL: http://localhost:4000
```

#### Terminal 2 - Start the Web App:

```bash
cd ~/Desktop/nbastats
npm run dev:web
```

You should see:
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
```

### Step 8: Open in Browser

1. Open your web browser
2. Go to: **http://localhost:3000**
3. You should see your NBA Stats homepage! 🎉

### Step 9: Test the API

Open another browser tab and go to: **http://localhost:4000**

You should see:
```json
{
  "message": "NBA Stats API is running!",
  "status": "success"
}
```

## 🎯 What You Just Built

### **apps/api** - The Backend
- **What it is:** A server that handles data and business logic
- **Technology:** Node.js with Express framework
- **Database:** Connects to PostgreSQL using Prisma
- **Port:** Runs on `http://localhost:4000`
- **Main file:** `apps/api/src/index.ts`

### **apps/web** - The Frontend
- **What it is:** The website users interact with
- **Technology:** Next.js (a React framework)
- **Styling:** Tailwind CSS (utility-first CSS framework)
- **Port:** Runs on `http://localhost:3000`
- **Main file:** `apps/web/src/app/page.tsx`

### **Supabase Database**
- **What it is:** Where all your data is stored (in the cloud)
- **Technology:** PostgreSQL (a powerful, professional database)
- **Runs in:** Supabase cloud (no local installation needed!)
- **Access:** From anywhere with internet
- **Dashboard:** Beautiful web interface to view your data

## 📝 Common Commands

### Start Everything
```bash
# Start API (in one terminal)
npm run dev:api

# Start web (in another terminal)
npm run dev:web
```

**That's it!** No database to start - Supabase is always running in the cloud!

### Stop Everything
```bash
# Stop servers: Press Ctrl + C in each terminal
```

Your Supabase database stays running in the cloud - that's fine and free!

### Install New Packages
```bash
# For API
cd apps/api
npm install <package-name>

# For Web
cd apps/web
npm install <package-name>
```

### Database Management
```bash
cd apps/api

# Open visual database editor
npm run prisma:studio

# Create database migration (after changing schema)
npm run prisma:migrate

# Regenerate Prisma client (after schema changes)
npm run prisma:generate
```

## 🗄️ Working with the Database

### Adding Your First Database Table

1. Open `apps/api/prisma/schema.prisma`
2. Uncomment the `Player` model (remove the `//` at the start of each line)
3. Run migration:
   ```bash
   cd apps/api
   npm run prisma:migrate
   ```
4. When prompted, name it: `add_player_model`
5. Regenerate client:
   ```bash
   npm run prisma:generate
   ```

Now you can use the Player model in your code!

### Viewing Your Database

```bash
cd apps/api
npm run prisma:studio
```

This opens a visual database editor in your browser at `http://localhost:5555`

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### "Port 4000 already in use"
```bash
# Kill the process using port 4000
lsof -ti:4000 | xargs kill -9
```

### "Cannot connect to database"
1. Check your `.env` file has the correct Supabase URL
2. Make sure you replaced `[YOUR-PASSWORD]` with your actual password
3. Verify your internet connection is working
4. Check Supabase dashboard - is your project "Active"?
5. Try regenerating Prisma client:
   ```bash
   cd apps/api
   npm run prisma:generate
   ```

### "Module not found" errors
```bash
# Delete all node_modules and reinstall
rm -rf node_modules apps/*/node_modules
npm install
```

### API not connecting to Web
1. Check API is running on http://localhost:4000
2. Check `apps/web/.env.local` has correct API URL
3. Restart the web server

## 📚 Next Steps - What to Learn

### 1. **Understand the Code Flow**
- Start by reading the comments in `apps/api/src/index.ts`
- Then look at `apps/web/src/app/page.tsx`
- Try to follow how data flows from database → API → web

### 2. **Make Small Changes**
- Change the welcome message in `page.tsx`
- Add a new route in `index.ts`
- Change colors in Tailwind classes

### 3. **Add Real Features**
- Uncomment the Player model in Prisma schema
- Create API endpoints to create/read/update/delete players
- Build forms in the web app to interact with the API

### 4. **Learn These Concepts**
- **TypeScript:** Adds types to JavaScript for safety
- **REST API:** How frontend and backend communicate
- **React Components:** Building blocks of your UI
- **Tailwind CSS:** Utility classes for styling
- **Prisma ORM:** Easy way to work with databases

## 🆘 Getting Help

### Useful Commands to Check Status

```bash
# Check if Node.js is installed
node --version

# Check what's running on port 3000
lsof -i :3000

# Check what's running on port 4000
lsof -i :4000

# Test API connection
curl http://localhost:4000/api/health

# View API logs
cd apps/api
npm run dev
```

### File Structure Explanation

```
apps/api/
  src/
    index.ts           ← Main API server file (start here!)
  prisma/
    schema.prisma      ← Database structure definition
  package.json         ← API dependencies list
  tsconfig.json        ← TypeScript configuration

apps/web/
  src/app/
    page.tsx           ← Home page component (start here!)
    layout.tsx         ← Wrapper around all pages
    globals.css        ← Global styles
  package.json         ← Web dependencies list
  tailwind.config.js   ← Tailwind CSS settings
```

## 🎓 Learning Resources

- **TypeScript:** https://www.typescriptlang.org/docs/
- **Next.js:** https://nextjs.org/learn
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Prisma:** https://www.prisma.io/docs/getting-started
- **Express.js:** https://expressjs.com/en/starter/basic-routing.html

## 💡 Tips for Beginners

1. **Read the comments** - I've added detailed comments explaining what each part does
2. **Change one thing at a time** - Test after each change to understand what it did
3. **Use the browser console** - Press F12 to see errors and logs
4. **Don't worry about breaking things** - You can always undo changes with Git
5. **Google error messages** - Most errors have been solved by someone else already

## 🔧 Advanced: Running in Production

When you're ready to deploy (make your app live on the internet):

1. **Build both apps:**
   ```bash
   cd apps/api
   npm run build
   
   cd ../web
   npm run build
   ```

2. **Set up a production database** (not Docker)
3. **Deploy to a hosting service** like Vercel (web) and Railway (API)

But don't worry about this yet - focus on building locally first!

---

**Made with ❤️ for beginners. Happy coding! 🚀**

Questions? Read through this README again - the answer is probably here!

