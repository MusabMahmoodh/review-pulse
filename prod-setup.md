# Production Setup Guide

This guide covers deploying Review Pulse to production using **AWS Amplify** (frontend), **Hostinger** (backend), and **Supabase** (database).

## Architecture Overview

```
┌─────────────────┐
│  AWS Amplify    │  → Frontend (Next.js)
│  (Frontend)     │
└────────┬────────┘
         │
         ↓ HTTPS
┌─────────────────┐
│   Hostinger      │  → Backend API (Express/Node.js)
│   (Backend)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Supabase      │  → PostgreSQL Database
│   (Database)    │
└─────────────────┘
```

---

## Part 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `review-pulse-prod`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate plan
4. Wait for project to be created (2-3 minutes)

### 1.2 Get Database Connection Details

1. Go to **Settings** → **Database**
2. Find **Connection string** section
3. Copy the connection details:
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: (the one you set during creation)

### 1.3 Run Database Migrations

1. **Option A: Using Supabase SQL Editor**
   - Go to **SQL Editor** in Supabase dashboard
   - Copy migration files from `server/src/migrations/`
   - Run them in order

2. **Option B: Using Local Migration Script**
   ```bash
   cd server
   # Update .env with Supabase connection details
   npm run migration:run
   ```

### 1.4 Create Admin User

```bash
cd server
npm run admin:create admin@yourdomain.com your-secure-password
```

---

## Part 2: Hostinger Backend Setup

### 2.1 Purchase Hostinger VPS/Shared Hosting

1. Go to [Hostinger](https://www.hostinger.com)
2. Choose **VPS Hosting** (recommended) or **Shared Hosting**
3. Select a plan and complete purchase
4. Note your server IP and credentials

### 2.2 Connect to Server

**For VPS (Linux):**
```bash
ssh root@your-server-ip
```

**For Shared Hosting:**
- Use Hostinger's File Manager or FTP client
- Or use SSH if available

### 2.3 Install Node.js and Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git
```

### 2.4 Deploy Backend Code

```bash
# Clone your repository
cd /var/www
git clone https://github.com/yourusername/review-pulse.git
cd review-pulse/server

# Install dependencies
npm install --production

# Create .env file
nano .env
```

### 2.5 Configure Environment Variables

Create `.env` file in `server/` directory:

```env
# Database Configuration (Supabase)
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_NAME=postgres

# Server Configuration
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-amplify-domain.amplifyapp.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-amplify-domain.amplifyapp.com/api/auth/google/callback

# Encryption Key (generate: openssl rand -hex 32)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# API URL
API_URL=https://your-backend-domain.com
```

### 2.6 Run Migrations

```bash
npm run migration:run
```

### 2.7 Start Backend with PM2

```bash
# Build TypeScript
npm run build  # If you have a build script, or use ts-node

# Start with PM2
pm2 start src/index.ts --name review-pulse-api --interpreter ts-node

# Or if compiled to JS:
pm2 start dist/index.js --name review-pulse-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 2.8 Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/review-pulse
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-backend-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/review-pulse /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### 2.9 Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-backend-domain.com

# Auto-renewal is set up automatically
```

### 2.10 Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Part 3: AWS Amplify Frontend Setup

### 3.1 Prepare Frontend for Production

1. **Update API Client URL**

   Edit `client/lib/api-client.ts`:
   ```typescript
   const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://your-backend-domain.com";
   ```

2. **Create `.env.production` in client directory:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```

### 3.2 Connect Repository to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New App"** → **"Host web app"**
3. Connect your Git provider (GitHub, GitLab, Bitbucket)
4. Select your repository: `review-pulse`
5. Select branch: `main` or `production`

### 3.3 Configure Build Settings

Amplify will auto-detect Next.js, but verify these settings:

**Build settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd client
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: client/.next
    files:
      - '**/*'
  cache:
    paths:
      - client/node_modules/**/*
      - client/.next/cache/**/*
```

**Environment variables** (in Amplify Console):
- `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.com`

### 3.4 Configure Custom Domain (Optional)

1. In Amplify Console, go to **App settings** → **Domain management**
2. Click **Add domain**
3. Enter your domain name
4. Follow DNS configuration instructions
5. SSL certificate is automatically provisioned

### 3.5 Deploy

1. Click **"Save and deploy"**
2. Wait for build to complete (5-10 minutes)
3. Your app will be live at: `https://xxxxx.amplifyapp.com`

---

## Part 4: Google OAuth Configuration

### 4.1 Update OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://your-amplify-domain.amplifyapp.com/api/auth/google/callback`
5. Save changes

---

## Part 5: Post-Deployment Checklist

### 5.1 Verify Backend

- [ ] Backend is accessible: `https://your-backend-domain.com/health`
- [ ] API docs available: `https://your-backend-domain.com/api-docs`
- [ ] Database connection working
- [ ] Migrations completed
- [ ] Admin user created

### 5.2 Verify Frontend

- [ ] Frontend loads: `https://your-amplify-domain.amplifyapp.com`
- [ ] API calls working (check browser console)
- [ ] Google OAuth working
- [ ] All features functional

### 5.3 Security Checklist

- [ ] SSL certificates active (HTTPS)
- [ ] Environment variables secured (not in code)
- [ ] Database credentials secure
- [ ] API keys protected
- [ ] CORS configured correctly
- [ ] Firewall rules set

### 5.4 Monitoring Setup

**PM2 Monitoring:**
```bash
pm2 monit
pm2 logs review-pulse-api
```

**Set up monitoring:**
- AWS CloudWatch (for Amplify)
- Hostinger monitoring tools
- Supabase dashboard for database metrics

---

## Part 6: Maintenance & Updates

### 6.1 Update Backend

```bash
cd /var/www/review-pulse
git pull origin main
cd server
npm install --production
npm run migration:run  # If new migrations
pm2 restart review-pulse-api
```

### 6.2 Update Frontend

- Push changes to your Git repository
- Amplify will automatically rebuild and deploy

### 6.3 Database Backups

Supabase provides automatic backups, but you can also:

1. **Manual backup via Supabase Dashboard:**
   - Go to **Database** → **Backups**
   - Download backup

2. **Automated backups:**
   - Use Supabase's backup feature
   - Or set up cron job for pg_dump

---

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs review-pulse-api

# Check if port is in use
netstat -tulpn | grep 3001

# Restart service
pm2 restart review-pulse-api
```

### Database Connection Issues

- Verify Supabase connection string
- Check firewall rules (Supabase allows connections from anywhere by default)
- Verify credentials in `.env`

### Frontend Build Fails

- Check Amplify build logs
- Verify environment variables
- Check Node.js version compatibility

### SSL Certificate Issues

```bash
# Renew certificate manually
certbot renew

# Check certificate status
certbot certificates
```

---

## Cost Estimation

- **Supabase**: Free tier available, paid plans start at $25/month
- **Hostinger VPS**: Starting at ~$4-10/month
- **AWS Amplify**: Free tier (1000 build minutes/month), then pay-as-you-go
- **Total**: ~$30-50/month for small to medium traffic

---

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws)
- [Hostinger Knowledge Base](https://www.hostinger.com/tutorials)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

