# Development Setup Guide

This guide covers setting up Review Pulse for development using **free cloud services** for easy access and collaboration.

Review Pulse helps teachers and educational institutes collect student feedback and turn it into AI-powered actionable insights.

## Architecture Overview

```
┌─────────────────┐
│    Vercel       │  → Frontend (Next.js) - Free Hosting
│  (Frontend)     │
└────────┬────────┘
         │
         ↓ HTTPS
┌─────────────────┐
│   Railway       │  → Backend API (Express/Node.js) - Free Tier
│   (Backend)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Supabase      │  → PostgreSQL Database - Free Tier
│   (Database)    │
└─────────────────┘
```

**Alternative Options:**
- **Render** (instead of Railway) - Free tier available
- **Fly.io** (instead of Railway) - Free tier available
- **Neon** (instead of Supabase) - Free PostgreSQL tier

---

## Part 1: Supabase Database Setup (Free Tier)

### 1.1 Create Free Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `review-pulse-dev`
   - **Database Password**: Generate and save password
   - **Region**: Choose closest region
   - **Pricing Plan**: **Free** (up to 500MB database, 2GB bandwidth)
4. Wait for project creation (~2 minutes)

### 1.2 Get Connection Details

1. Go to **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 1.3 Run Migrations

**Option A: Using Supabase SQL Editor**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy content from migration files in `server/src/migrations/`
3. Extract SQL and run in SQL Editor
4. Run migrations in order

**Option B: Using Local Setup**
```bash
cd server
# Create .env with Supabase connection details
npm run migration:run
```

### 1.4 Create Admin User

```bash
cd server
npm run admin:create admin@dev.com devpassword123
```

---

## Part 2: Railway Backend Setup (Free Tier)

### 2.1 Create Railway Account

1. Go to [Railway](https://railway.app)
2. Sign up with GitHub (free tier: $5 credit/month)
3. Verify email

### 2.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account
4. Select `review-pulse` repository
5. Select the `server` directory as root

### 2.3 Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_NAME=postgres
PORT=3001
NODE_ENV=development
CLIENT_URL=https://your-vercel-app.vercel.app

# JWT Secret (generate: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

API_URL=https://your-railway-app.up.railway.app
```

### 2.4 Configure Build Settings

Railway auto-detects Node.js, but verify:

1. Go to **Settings** → **Build**
2. **Build Command**: Leave empty (or `npm install`)
3. **Start Command**: `npm start` (or `ts-node src/index.ts`)
4. **Root Directory**: `server`

### 2.5 Deploy

1. Railway will automatically deploy on push to main branch
2. Or click **"Deploy"** manually
3. Wait for deployment (~2-3 minutes)
4. Get your backend URL: `https://your-app.up.railway.app`

### 2.6 Run Migrations

After first deployment, run migrations:

**Option A: Via Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run npm run migration:run
```

**Option B: Via Railway Dashboard**
1. Go to your service
2. Click **"Deployments"** → **"View Logs"**
3. Use **"Run Command"** feature
4. Run: `npm run migration:run`

---

## Part 3: Vercel Frontend Setup (Free Tier)

### 3.1 Create Vercel Account

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub (free forever tier)
3. Connect your GitHub account

### 3.2 Import Project

1. Click **"Add New"** → **"Project"**
2. Import your `review-pulse` repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### 3.3 Configure Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.up.railway.app
```

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for build (~2-3 minutes)
3. Your app will be live at: `https://your-app.vercel.app`

### 3.5 Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration instructions
4. SSL is automatic

---

## Part 4: Local Development Setup

### 4.1 Clone Repository

```bash
git clone https://github.com/yourusername/review-pulse.git
cd review-pulse
```

### 4.2 Backend Setup

```bash
cd server
npm install

# Create .env file
```

Edit `server/.env`:
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_NAME=postgres
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

API_URL=http://localhost:3001
```

```bash
# Run migrations
npm run migration:run

# Start dev server
npm run dev
```

### 4.3 Frontend Setup

```bash
cd client
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start dev server
npm run dev
```

---

## Part 5: Development Workflow

### 5.1 Making Changes

1. **Local Development:**
   - Make changes locally
   - Test on `localhost:3000` and `localhost:3001`
   - Commit and push to GitHub

2. **Automatic Deployments:**
   - **Vercel**: Auto-deploys on push to main branch
   - **Railway**: Auto-deploys on push to main branch
   - Both provide preview deployments for PRs

### 5.2 Database Migrations

```bash
# Create new migration
cd server
npm run migration:generate -- -n MigrationName

# Run migrations locally
npm run migration:run

# Run migrations on Railway
railway run npm run migration:run
```

### 5.3 Viewing Logs

**Railway:**
- Go to Railway dashboard → Your service → **Logs**

**Vercel:**
- Go to Vercel dashboard → Your project → **Deployments** → Click deployment → **Logs**

**Local:**
```bash
# Backend logs
cd server
npm run dev

# Frontend logs
cd client
npm run dev
```

---

## Part 6: Free Tier Limits & Considerations

### Supabase Free Tier
- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ Unlimited API requests
- ✅ 2 projects
- ⚠️ Database pauses after 1 week of inactivity

### Railway Free Tier
- ✅ $5 credit/month (~500 hours of usage)
- ✅ Auto-deployments
- ✅ Custom domains
- ⚠️ Spins down after inactivity (wakes on request)

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Preview deployments
- ⚠️ 100 build minutes/month

### Render Free Tier
- ✅ 750 hours/month
- ✅ 100GB bandwidth/month
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Slower cold starts

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Check if Supabase project is paused
# Go to Supabase dashboard and resume if needed
```

### Railway Deployment Fails

- Check build logs in Railway dashboard
- Verify environment variables
- Check Node.js version compatibility
- Ensure `package.json` has correct start script

### Vercel Build Fails

- Check build logs in Vercel dashboard
- Verify `NEXT_PUBLIC_API_URL` is set
- Check for TypeScript errors
- Verify Node.js version (Vercel uses 18.x by default)

### Backend Not Accessible

- Check Railway/Render logs
- Verify PORT environment variable
- Check if service is running (not paused)
- Verify CORS settings allow Vercel domain

---

## Quick Start Checklist

- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Railway/Render backend deployed
- [ ] Backend environment variables configured
- [ ] Vercel frontend deployed
- [ ] Frontend environment variables configured
- [ ] Local development environment working
- [ ] All services accessible and communicating

---

## Cost Summary

**All Free Tier:**
- Supabase: $0/month
- Railway: $0/month (with $5 credit)
- Vercel: $0/month
- **Total: $0/month** 🎉

**Note**: For production, consider paid tiers for better performance and reliability.

---

## Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
