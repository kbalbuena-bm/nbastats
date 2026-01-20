# 🏀 NBA Stats - Simple Version (No Database!)

A full-stack NBA statistics application that fetches real-time data from the official NBA Stats API.

**✨ What makes this simple:** No database setup required! Just install and run.

## 📁 Project Structure

```
nbastats/
├── apps/
│   ├── api/              # Backend API (Node.js + Express + TypeScript)
│   │   └── src/          # Fetches data from NBA Stats API
│   │
│   └── web/              # Frontend (Next.js + TypeScript + Tailwind)
│       └── src/app/      # Displays NBA data beautifully
│
├── package.json          # Root monorepo configuration
└── README-SIMPLE.md      # This file!
```

## 🚀 Super Quick Start (3 Steps!)

### Prerequisites

You only need **Node.js** installed:
- Download from: https://nodejs.org/ (choose LTS version)

### Step 1: Install Dependencies

Open Terminal and run:

```bash
cd ~/Desktop/nbastats
npm install
```

Wait 2-3 minutes for packages to install.

### Step 2: Create Environment Files

#### For the API:
```bash
cat > apps/api/.env << 'EOF'
PORT=4000
NODE_ENV=development
EOF
```

#### For the Web:
```bash
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
```

### Step 3: Start Both Servers

Open **two terminal windows**:

**Terminal 1 - API:**
```bash
cd ~/Desktop/nbastats
npm run dev:api
```

You should see:
```
🏀 NBA Stats API Server is running!
📍 URL: http://localhost:4000
```

**Terminal 2 - Web:**
```bash
cd ~/Desktop/nbastats
npm run dev:web
```

You should see:
```
▲ Next.js 14.0.4
- Local: http://localhost:3000
```

### Step 4: Open in Browser

Go to: **http://localhost:3000**

You should see hundreds of real NBA players! 🎉

## 🎯 What You Just Built

### **apps/api** - The Backend Proxy
- Fetches data from NBA Stats API
- Handles CORS and API requests
- No database needed!
- **Port:** http://localhost:4000

### **apps/web** - The Frontend
- Beautiful UI with Tailwind CSS
- Displays real NBA data
- Search and filter players
- **Port:** http://localhost:3000

## 🏀 Available NBA Data

Your API can fetch:

| Endpoint | What It Gets | Example |
|----------|-------------|---------|
| `/api/players/all` | All current NBA players | 530+ players |
| `/api/player/:id/career` | Player career stats | `/api/player/2544/career` (LeBron) |
| `/api/player/:id/info` | Player details | Height, weight, position |
| `/api/team/:id/roster` | Team roster | `/api/team/1610612747/roster` (Lakers) |

## 📝 Daily Usage

### Start Everything
```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:web
```

### Stop Everything
Press `Ctrl + C` in both terminals

## 🎓 Try These Player IDs

Test the API with these famous players:

```bash
# LeBron James
curl http://localhost:4000/api/player/2544/career

# Stephen Curry
curl http://localhost:4000/api/player/201939/career

# Kevin Durant
curl http://localhost:4000/api/player/201142/career

# Giannis Antetokounmpo  
curl http://localhost:4000/api/player/203507/career
```

Or visit in browser:
- http://localhost:4000/api/player/2544/info

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill -9
```

### "Port 4000 already in use"
```bash
lsof -ti:4000 | xargs kill -9
```

### "Failed to fetch players"
1. Make sure API is running (Terminal 1)
2. Check http://localhost:4000/api/health
3. Restart both terminals

### "Module not found"
```bash
rm -rf node_modules apps/*/node_modules
npm install
```

## 📚 Next Steps - Add Cool Features!

### 1. Player Detail Page
Create a page to show individual player stats:
```typescript
// apps/web/src/app/player/[id]/page.tsx
export default async function PlayerPage({ params }: { params: { id: string } }) {
  // Fetch player career stats
  // Display charts and graphs
}
```

### 2. Team Rosters Page
Show all teams and their rosters

### 3. Live Game Scores
Add today's game scores endpoint

### 4. Player Comparison
Compare two players side-by-side

### 5. Add Charts
Use Chart.js or Recharts to visualize stats

## 🎨 Customize the UI

All styles are in Tailwind CSS - super easy to change!

```tsx
// Change button color from blue to red:
className="bg-blue-600"  // Old
className="bg-red-600"   // New

// Make text bigger:
className="text-xl"      // Old
className="text-3xl"     // New
```

## 💡 Understanding the Code

### How Data Flows:

```
1. User opens http://localhost:3000
   ↓
2. Next.js frontend loads
   ↓
3. Frontend calls: http://localhost:4000/api/players/all
   ↓
4. Your API server receives request
   ↓
5. Your API calls: https://stats.nba.com/stats/commonallplayers
   ↓
6. NBA API returns player data
   ↓
7. Your API sends it to frontend
   ↓
8. Frontend displays players beautifully
```

### Why Use Your Own API?

You might wonder: "Why not call NBA API directly from frontend?"

Good reasons:
- ✅ **CORS issues** - NBA API blocks browser requests
- ✅ **Can add caching** - Save API calls, load faster
- ✅ **Can transform data** - Clean up the format
- ✅ **Can add features** - Combine multiple APIs
- ✅ **Security** - Hide API keys if needed

## 🆘 Learning Resources

### Technologies Used:

| Tech | What It Does | Learn More |
|------|-------------|-----------|
| **TypeScript** | JavaScript with types | [typescriptlang.org](https://www.typescriptlang.org/docs/) |
| **Next.js** | React framework | [nextjs.org/learn](https://nextjs.org/learn) |
| **Express** | API server | [expressjs.com](https://expressjs.com/) |
| **Tailwind CSS** | Styling | [tailwindcss.com/docs](https://tailwindcss.com/docs) |

### NBA API Documentation:
- [swar/nba_api](https://github.com/swar/nba_api) - Python library docs (same API)
- All endpoints work the same way

## 🔥 Want to Add a Database Later?

If you want to store data (user accounts, favorites, custom stats):

1. Check out **SUPABASE-SETUP.md** in this repo
2. Add Prisma back to the API
3. Store NBA data in your database
4. Add user features

But for now, keep it simple! Build features without a database first.

## ❓ Common Questions

### "Is this using real NBA data?"
**Yes!** It fetches from https://stats.nba.com/stats/ - the official NBA API.

### "Do I need an API key?"
**No!** The NBA Stats API is public and free.

### "Can I deploy this online?"
**Yes!** Deploy:
- Frontend → Vercel (free)
- Backend → Railway or Render (free tier)

### "Will this work offline?"
**No** - it needs internet to fetch NBA data. But you could add caching later!

### "How many API calls can I make?"
No official limit, but be reasonable. Don't spam requests.

## 🎉 You Did It!

You now have a working NBA stats application with:
- ✅ Real NBA data
- ✅ Beautiful UI
- ✅ Search functionality
- ✅ No database complexity
- ✅ Easy to extend

**Next:** Start building! Add player pages, stats charts, game scores, or whatever you want!

---

**Questions?** Read through this guide again - answers are here!

**Need the full version with database?** Check out **README.md**

Happy coding! 🚀🏀

