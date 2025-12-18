# Supabase Connection Troubleshooting

## Common Issues and Solutions

### Issue 1: "Connection terminated unexpectedly" or "TLS connection failed"

**Most Common Cause: Supabase Project is Paused**

Supabase free tier projects pause after 1 week of inactivity. You need to resume the project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Find your project: `review-pulse-dev`
3. If you see a "Resume" or "Restore" button, click it
4. Wait 1-2 minutes for the project to resume
5. Try connecting again

**Check Project Status:**
- Go to your project dashboard
- Look for any warnings about paused/inactive projects
- Check the project status indicator (should be green/active)

---

### Issue 2: SSL/TLS Connection Errors

**Solution: Verify SSL Configuration**

The code automatically enables SSL for Supabase, but verify your `.env` file:

```env
DB_HOST=db.jedhrenbyvcvipxsylge.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=review-pulse-dev
DB_NAME=postgres
```

**Important Notes:**
- Host must include `db.` prefix
- Port should be `5432` (not the connection pooler port `6543`)
- Password should not have extra spaces or quotes
- Database name is always `postgres` for Supabase

---

### Issue 3: Test Connection Manually

**Using psql (if installed):**
```bash
psql "postgresql://postgres:review-pulse-dev@db.jedhrenbyvcvipxsylge.supabase.co:5432/postgres?sslmode=require"
```

**Using Node.js test script:**
Create `test-connection.js`:
```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'db.jedhrenbyvcvipxsylge.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'review-pulse-dev',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    console.log('✅ Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then((res) => {
    console.log('✅ Query successful:', res.rows[0]);
    client.end();
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    client.end();
  });
```

Run: `node test-connection.js`

---

### Issue 4: Verify Supabase Settings

1. **Check Connection Pooling:**
   - Go to **Settings** → **Database** → **Connection Pooling**
   - Note: For migrations, use direct connection (port 5432)
   - For application, you can use pooler (port 6543)

2. **Check IP Restrictions:**
   - Go to **Settings** → **Database** → **Connection Pooling** → **IP Allowlist**
   - By default, Supabase allows connections from anywhere
   - If you added IP restrictions, make sure your IP is allowed

3. **Check Database Status:**
   - Go to **Settings** → **Database**
   - Verify database is active (not paused)
   - Check storage usage (free tier: 500MB limit)

---

### Issue 5: Network/Firewall Issues

**If you're behind a corporate firewall:**
- Try from a different network (mobile hotspot)
- Check if your firewall blocks PostgreSQL connections (port 5432)
- Contact your network administrator

**If using VPN:**
- Try disconnecting VPN
- Some VPNs block database connections

---

### Issue 6: Wrong Connection String Format

**Correct format for Supabase:**
```
postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

**Common mistakes:**
- ❌ Missing `db.` prefix in host
- ❌ Using wrong port (should be 5432 for direct, 6543 for pooler)
- ❌ Wrong database name (should be `postgres`, not project name)
- ❌ Password with special characters not URL-encoded

---

### Issue 7: TypeORM SSL Configuration

The code should automatically handle SSL for Supabase. If issues persist:

1. Verify `data-source.ts` has:
   ```typescript
   ssl: isSupabase ? {
       rejectUnauthorized: false
   } : false,
   ```

2. Check that `DB_HOST` includes `supabase.co` (for auto-detection)

3. Try explicitly setting SSL:
   ```env
   DB_SSL=true
   ```
   Then update code to check this variable.

---

## Quick Checklist

- [ ] Supabase project is active (not paused)
- [ ] `.env` file has correct credentials
- [ ] Host includes `db.` prefix
- [ ] Port is `5432`
- [ ] Database name is `postgres`
- [ ] Password has no extra spaces
- [ ] SSL is enabled in code (automatic for Supabase)
- [ ] Network/firewall allows connections
- [ ] Tested connection manually with psql or Node.js

---

## Still Having Issues?

1. **Check Supabase Dashboard:**
   - Project status
   - Database logs
   - Connection metrics

2. **Check Application Logs:**
   ```bash
   cd server
   npm run dev
   # Look for connection errors
   ```

3. **Contact Support:**
   - Supabase: [Discord](https://discord.supabase.com) or [GitHub Discussions](https://github.com/supabase/supabase/discussions)
   - Check Supabase status: [status.supabase.com](https://status.supabase.com)









