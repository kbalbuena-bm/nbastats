# ⚡ Quick Start - No Database Version

The simplest way to get started! No database setup needed.

## 1️⃣ Install
```bash
cd ~/Desktop/nbastats
npm install
```

## 2️⃣ Create Environment Files

```bash
# API environment
cat > apps/api/.env << 'EOF'
PORT=4000
NODE_ENV=development
EOF

# Web environment
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
```

## 3️⃣ Start API (Terminal 1)
```bash
npm run dev:api
```
**Leave this running!** Should show: `🏀 NBA Stats API Server is running!`

## 4️⃣ Start Web (Terminal 2)
```bash
npm run dev:web
```
**Leave this running!** Should show: `▲ Next.js`

## 5️⃣ Open Browser
- **Web App:** http://localhost:3000
- **API Info:** http://localhost:4000

---

## 🛑 To Stop

Press `Ctrl + C` in both terminals

## 🔄 To Restart

```bash
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
```

---

**That's it! No database, no Prisma, no Supabase - just pure NBA data! 🏀**

See **README-SIMPLE.md** for detailed docs!

