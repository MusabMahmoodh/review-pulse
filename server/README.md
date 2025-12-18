# Review Pulse Server

Backend server for the Review Pulse application using Express, TypeORM, and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the server root with:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=review_pulse
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Google OAuth (for Google Reviews integration - Business Profile API)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Google Places API (easier alternative for testing - just needs API key, no OAuth!)
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Encryption key for OAuth tokens (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# OpenAI API Key (for AI insights generation)
OPENAI_API_KEY=your_openai_api_key
```

3. Make sure PostgreSQL is running and the database exists.

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new restaurant
- `POST /api/auth/login` - Login restaurant
- `GET /api/auth/google/authorize?restaurantId=xxx` - Initiate Google OAuth authorization
- `GET /api/auth/google/callback` - Handle Google OAuth callback

### Feedback
- `POST /api/feedback/submit` - Submit customer feedback
- `GET /api/feedback/list?restaurantId=xxx` - List feedback for a restaurant
- `GET /api/feedback/stats?restaurantId=xxx` - Get feedback statistics

### Restaurants
- `GET /api/restaurants/keywords?restaurantId=xxx` - Get restaurant keywords

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/restaurants` - List all restaurants (admin)
- `PATCH /api/admin/restaurants/status` - Update restaurant status

### External Reviews
- `GET /api/external-reviews/list?restaurantId=xxx` - List external reviews
- `POST /api/external-reviews/sync` - Sync external reviews from Google (and other platforms)
  - Use `platforms: ["google"]` for Business Profile API (requires OAuth)
  - Use `platforms: ["google-places"]` for Places API (easier, just needs API key)
  - Optional: `placeId` parameter for Places API
- `GET /api/external-reviews/search-place?query=xxx` - Search for Google Place IDs

### AI
- `GET /api/ai/insights?restaurantId=xxx&timePeriod=xxx` - Get AI insights (optional timePeriod: 2days, week, month, 2months, 3months, 4months, 5months, 6months)
- `POST /api/ai/generate-insights` - Generate AI insights with OpenAI (requires timePeriod: 2days, week, month, 2months, 3months, 4months, 5months, 6months)
- `POST /api/ai/chat` - AI chat (placeholder)

## Database Models

- `Restaurant` - Restaurant information
- `RestaurantAuth` - Restaurant authentication credentials
- `CustomerFeedback` - Customer feedback submissions
- `ExternalReview` - External platform reviews (Google, Facebook, Instagram)
- `GoogleIntegration` - Google OAuth integration data (tokens, location IDs)
- `AIInsight` - AI-generated insights and recommendations
- `Admin` - Admin users
- `Subscription` - Restaurant subscription plans

## Development

The server uses TypeORM with PostgreSQL with migrations enabled. **Never use `synchronize: true` in production!**

### Database Setup

1. Create your PostgreSQL database:
```sql
CREATE DATABASE review_pulse;
```

2. Run migrations to set up the schema:
```bash
npm run migration:run
```

3. Create an admin user:
```bash
npm run admin:create
# Or with custom credentials:
npm run admin:create admin@example.com mypassword123
```

4. (Optional) Bootstrap demo data for testing:
```bash
npm run data:bootstrap
```

For more details on migrations, see [MIGRATIONS.md](./MIGRATIONS.md).
For more details on utility scripts, see [SCRIPTS.md](./SCRIPTS.md).

## API Documentation

Swagger API documentation is available at:
- **Development**: http://localhost:3001/api-docs

The Swagger UI provides interactive API documentation where you can test all endpoints directly from your browser.

