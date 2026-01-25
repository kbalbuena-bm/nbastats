# 🚂 Deploy API to Railway

## Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

## Step 2: Deploy Your API
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `nbastats` repository
4. Railway will ask which folder - select `apps/api`

## Step 3: Configure the Build
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`
- **Root Directory**: `apps/api`

## Step 4: Railway will give you a URL like:
```
https://your-api.up.railway.app
```

**SAVE THIS URL!** You'll need it for Vercel.

---

## ⚠️ Note:
Your API doesn't need environment variables because it just fetches from the NBA API (no database writes).

---

After Railway deployment succeeds, come back and we'll deploy the web app to Vercel!
