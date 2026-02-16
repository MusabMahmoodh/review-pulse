# Development Setup Guide

This guide now uses the **current architecture**: single Next.js app on Vercel + Supabase (DB + Auth).

## ✅ Current Architecture (2026)

There is **no separate backend deployment** in the active setup.

```
┌─────────────────────────────┐
│           Vercel            │
│  Next.js UI + API Routes    │
│    (Vercel Functions)       │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│          Supabase           │
│  Postgres + Supabase Auth   │
└─────────────────────────────┘
```

### Required env vars (`client/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
SERPER_API_KEY=...
ENCRYPTION_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=
```

### Local run

```bash
cd client
npm install
npm run dev
```

---

## Legacy Reference (Pre-migration)

The sections below that mention Railway/Hostinger/separate backend are legacy reference from the old architecture.

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
2. Copy content from `server/src/migrations/InitialMigration1765721925211.ts`
3. Extract SQL and run in SQL Editor
4. Repeat for other migration files

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

# Google OAuth (use test credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/api/auth/google/callback

# Generate: openssl rand -hex 32
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# OpenAI API Key (get from OpenAI)
OPENAI_API_KEY=your_openai_api_key

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


## Alternative: Render Setup (Free Tier)

If Railway doesn't work, use Render:

### Render Backend Setup

1. Go to [Render](https://render.com) and sign up
2. Click **"New"** → **"Web Service"**
3. Connect GitHub repository
4. Configure:
   - **Name**: `review-pulse-api`
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: `server`
5. Add environment variables (same as Railway)
6. Deploy

**Note**: Render free tier spins down after 15 minutes of inactivity. First request may be slow.


## Alternative: Fly.io Setup (Free Tier)

### Fly.io Backend Setup

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Sign up:
   ```bash
   fly auth signup
   ```

3. Create app:
   ```bash
   cd server
   fly launch
   ```

4. Configure `fly.toml`:
   ```toml
   app = "review-pulse-api"
   primary_region = "iad"

   [build]

   [env]
     PORT = "3001"
     NODE_ENV = "production"

   [[services]]
     internal_port = 3001
     protocol = "tcp"
   ```

5. Set secrets:
   ```bash
   fly secrets set DB_HOST=db.xxxxx.supabase.co
   fly secrets set DB_PASSWORD=your_password
   # ... add all other env vars
   ```

6. Deploy:
   ```bash
   fly deploy
   ```


## Part 4: Google OAuth Setup (Development)

### 4.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: `review-pulse-dev`
3. Enable **Google Business Profile API** (if needed)

### 4.2 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External**
3. Fill in:
   - App name: `Review Pulse Dev`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes: `https://www.googleapis.com/auth/business.manage`
5. Add test users (your email)

### 4.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Review Pulse Dev Client`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (local)
   - `https://your-vercel-app.vercel.app/api/auth/google/callback` (Vercel)
6. Save **Client ID** and **Client Secret**


## Part 5: OpenAI API Key (Free Trial)

### 5.1 Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up/login
3. Go to **API Keys**
4. Click **"Create new secret key"**
5. Copy and save the key (starts with `sk-`)

**Note**: Free tier includes $5 credit. GPT-4o-mini is very affordable (~$0.15 per 1M tokens).


## Part 6: Local Development Setup

### 6.1 Clone Repository

```bash
git clone https://github.com/yourusername/review-pulse.git
cd review-pulse
```

### 6.2 Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env  # Or create manually
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

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

ENCRYPTION_KEY=your_32_byte_hex_encryption_key
OPENAI_API_KEY=your_openai_api_key

API_URL=http://localhost:3001
```

```bash
# Run migrations
npm run migration:run

# Start dev server
npm run dev
```

### 6.3 Frontend Setup

```bash
cd client
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start dev server
npm run dev
```


## Part 7: Development Workflow

### 7.1 Making Changes

1. **Local Development:**
   - Make changes locally
   - Test on `localhost:3000` and `localhost:3001`
   - Commit and push to GitHub

2. **Automatic Deployments:**
   - **Vercel**: Auto-deploys on push to main branch
   - **Railway**: Auto-deploys on push to main branch
   - Both provide preview deployments for PRs

### 7.2 Database Migrations

```bash
# Create new migration
cd server
npm run migration:generate -- -n MigrationName

# Run migrations locally
npm run migration:run

# Run migrations on Railway
railway run npm run migration:run
```

### 7.3 Viewing Logs

**Railway:**

**Vercel:**

**Local:**
```bash
# Backend logs
cd server
npm run dev

# Frontend logs
cd client
npm run dev
```


## Part 8: Free Tier Limits & Considerations

### Supabase Free Tier

### Railway Free Tier

### Vercel Free Tier

### Render Free Tier


## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Check if Supabase project is paused
# Go to Supabase dashboard and resume if needed
```

### Railway Deployment Fails


### Vercel Build Fails


### Backend Not Accessible



## Quick Start Checklist



## Cost Summary

**All Free Tier:**

**Note**: For production, consider paid tiers for better performance and reliability.


## Support Resources


