# Utility Scripts

This directory contains utility scripts for managing the Review Pulse server.

## Admin Management

### Create Admin User

Create a new admin user for the system.

**Usage:**
```bash
npm run admin:create [email] [password] [role]
```

**Examples:**
```bash
# Create admin with default credentials (admin@reviewpulse.com / admin123)
npm run admin:create

# Create admin with custom email and password
npm run admin:create admin@example.com mypassword123

# Create admin with custom email, password, and role
npm run admin:create admin@example.com mypassword123 super_admin
```

**Environment Variables:**
You can also set default values in `.env`:
```env
ADMIN_EMAIL=admin@reviewpulse.com
ADMIN_PASSWORD=admin123
```

**Roles:**
- `super_admin` - Full access (default)
- `admin` - Standard admin access

**Notes:**
- The script will check if an admin with the same email already exists
- Passwords are automatically hashed using bcrypt
- Admin ID is auto-generated

## Data Bootstrap

### Bootstrap Demo Data

Create a demo restaurant with sample feedback, external reviews, and AI insights for testing.

**Usage:**
```bash
npm run data:bootstrap
```

**What it creates:**
- **Restaurant:** "The Culinary Corner"
  - Email: `demo@restaurant.com`
  - Password: `demo123`
  - Restaurant ID: Auto-generated
- **Feedback:** 6 sample feedback entries with various ratings
- **External Reviews:** 3 reviews from Google, Facebook, and Instagram
- **AI Insight:** 1 AI-generated insight with recommendations

**Demo Credentials:**
```
Email: demo@restaurant.com
Password: demo123
```

**Notes:**
- The script checks if a demo restaurant already exists
- If it exists, the script will exit without creating duplicates
- Delete the existing demo restaurant first if you want to recreate it
- All dates are set to recent dates (within the last week)

## Running Scripts

Make sure your database is set up and migrations have been run before executing these scripts:

```bash
# 1. Set up database (if not already done)
npm run migration:run

# 2. Create admin user
npm run admin:create

# 3. Bootstrap demo data
npm run data:bootstrap
```

## Troubleshooting

### "Admin already exists"
If you see this error, either:
- Use a different email address
- Delete the existing admin from the database manually
- Use the existing admin credentials

### "Demo restaurant already exists"
If you see this warning:
- The demo restaurant is already in your database
- Use the existing credentials: `demo@restaurant.com` / `demo123`
- Or delete it from the database if you want to recreate it

### Database Connection Errors
Make sure:
- Your `.env` file is configured correctly
- PostgreSQL is running
- The database exists and migrations have been run


