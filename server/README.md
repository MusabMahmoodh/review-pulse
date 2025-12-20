# Guestra Server

Backend server for the Guestra application using Express, TypeORM, and PostgreSQL.

Guestra helps teachers and educational institutes collect student feedback and turn it into AI-powered actionable insights.

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

# Encryption key for OAuth tokens (optional - only if using external integrations)
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# OpenAI API Key (for AI insights generation)
OPENAI_API_KEY=your_openai_api_key

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

3. Make sure PostgreSQL is running and the database exists.

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register/organization` - Register a new organization (institute)
- `POST /api/auth/register/teacher` - Register a new teacher (standalone or under organization)
- `POST /api/auth/login` - Login (supports both organization and teacher)
- `GET /api/auth/me` - Get current authenticated user

### Feedback
- `POST /api/feedback/submit` - Submit student feedback
- `GET /api/feedback/list?teacherId=xxx` - List feedback for a teacher
- `GET /api/feedback/stats?teacherId=xxx` - Get feedback statistics

### Teachers
- `GET /api/teachers` - List teachers (for organizations)
- `POST /api/teachers` - Add teacher to organization
- `GET /api/teachers/:id` - Get teacher details

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/teachers` - List all teachers (admin)
- `GET /api/admin/organizations` - List all organizations (admin)
- `PATCH /api/admin/teachers/status` - Update teacher status

### External Reviews (Optional)
- `GET /api/external-reviews/list?teacherId=xxx` - List external reviews (if integrated)
- Note: External reviews integration is optional. The core functionality uses QR-based student feedback.

### AI
- `GET /api/ai/insights?teacherId=xxx&timePeriod=xxx` - Get AI insights (optional timePeriod: 2days, week, month, 2months, 3months, 4months, 5months, 6months)
- `POST /api/ai/generate-insights` - Generate AI insights with OpenAI (requires timePeriod)
- `POST /api/ai/chat` - AI chat for feedback analysis

## Database Models

- `Organization` - Educational institute information
- `OrganizationAuth` - Organization authentication credentials
- `Teacher` - Teacher information (can belong to organization or standalone)
- `TeacherAuth` - Teacher authentication credentials
- `StudentFeedback` - Student feedback submissions (QR-based)
- `ExternalReview` - External platform reviews (optional - Google, Facebook, Instagram)
- `GoogleIntegration` - Google OAuth integration data (optional - tokens, location IDs)
- `MetaIntegration` - Meta (Facebook/Instagram) OAuth integration data (optional)
- `AIInsight` - AI-generated insights and recommendations
- `ActionableItem` - Actionable items derived from feedback
- `Admin` - Admin users
- `Subscription` - Subscription plans (for organizations or teachers)
- `TeamMember` - Team members (for organizations or teachers)

## Development

The server uses TypeORM with PostgreSQL with migrations enabled. **Never use `synchronize: true` in production!**

### Database Setup

1. Create your PostgreSQL database:
```sql
CREATE DATABASE guestra;
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
