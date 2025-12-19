# Server Setup Guide

## Quick Start

### 1. Configure Database Credentials

Edit the `.env` file in the server directory and update the database credentials:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres              # Your PostgreSQL username (usually 'postgres')
DB_PASSWORD=your_password    # Your PostgreSQL password
DB_NAME=review_pulse         # Database name
```

**Common PostgreSQL setups:**
- **Default user**: `postgres`
- **Default password**: Usually set during PostgreSQL installation, or check your system configuration
- **No password**: If you use peer authentication, you might need to use your system username

### 2. Create the Database

Create the PostgreSQL database:

```bash
# Option 1: Using psql command line
psql -U postgres -c "CREATE DATABASE review_pulse;"

# Option 2: Interactive psql
psql -U postgres
CREATE DATABASE review_pulse;
\q
```

**If you get authentication errors:**
- Try using your system username instead of `postgres`
- Check if PostgreSQL is configured for peer authentication (common on Linux)
- You may need to use: `sudo -u postgres psql`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

Set up the database schema:

```bash
npm run migration:run
```

### 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Troubleshooting

### Authentication Failed

If you see "password authentication failed":

1. **Check your PostgreSQL user and password:**
   ```bash
   # Try connecting manually
   psql -U postgres -d postgres
   ```

2. **If using peer authentication (Linux):**
   - Use your system username in `DB_USER`
   - Or configure PostgreSQL for password authentication

3. **Reset PostgreSQL password:**
   ```bash
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'new_password';
   ```

### Database Doesn't Exist

Create it manually:
```bash
psql -U postgres -c "CREATE DATABASE review_pulse;"
```

### Connection Refused

Make sure PostgreSQL is running:
```bash
# Check status
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql
```

## Environment Variables

The `.env` file should contain:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=review_pulse

# Server Configuration
PORT=3001
NODE_ENV=development

# Client URL (for QR code generation)
CLIENT_URL=http://localhost:3000

# API URL (for Swagger)
API_URL=http://localhost:3001
```

## Verify Setup

Once the server starts successfully, you should see:
- "Database connected successfully"
- "Server is running on port 3001"

Then visit:
- **API Docs**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health













