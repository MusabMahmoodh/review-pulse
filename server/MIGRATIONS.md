# Database Migrations Guide

This project uses TypeORM migrations to manage database schema changes. Migrations allow you to version control your database schema and apply changes in a controlled manner.

## Setup

1. Make sure your `.env` file is configured with the correct database credentials.

2. Install dependencies:
```bash
npm install
```

## Migration Commands

### Generate a new migration
After making changes to your entities, generate a migration:
```bash
npm run migration:generate
```

This will create a new migration file in `src/migrations/` based on the differences between your entities and the current database schema.

### Create an empty migration
To create an empty migration file that you can fill manually:
```bash
npm run migration:create
```

### Run pending migrations
Apply all pending migrations to the database:
```bash
npm run migration:run
```

### Revert the last migration
Revert the most recently executed migration:
```bash
npm run migration:revert
```

### Show migration status
View which migrations have been executed and which are pending:
```bash
npm run migration:show
```

## Initial Setup

For the first time setup, you can either:

1. **Use the provided initial migration** (recommended for new databases):
   ```bash
   npm run migration:run
   ```

2. **Generate a fresh migration** from your entities:
   ```bash
   npm run migration:generate
   npm run migration:run
   ```

## Migration File Structure

Migration files are located in `src/migrations/` and follow the naming pattern:
- `{Timestamp}MigrationName.ts`

Each migration file exports a class that implements `MigrationInterface` with:
- `up()`: Method to apply the migration
- `down()`: Method to revert the migration

## Best Practices

1. **Always review generated migrations** before running them
2. **Test migrations** on a development database first
3. **Never edit executed migrations** - create a new migration instead
4. **Use descriptive migration names** when creating manually
5. **Keep migrations small and focused** - one logical change per migration
6. **Always test the `down()` method** to ensure you can rollback if needed

## Production Deployment

In production:
1. Always run migrations before starting the application
2. Use a migration tool or script in your deployment pipeline
3. Never use `synchronize: true` in production
4. Backup your database before running migrations
5. Test migrations on a staging environment first

## Troubleshooting

### Migration conflicts
If you have conflicts between team members' migrations:
1. Pull the latest migrations
2. Generate a new migration for your changes
3. Review and merge if needed

### Database out of sync
If your database schema doesn't match your entities:
1. Check migration status: `npm run migration:show`
2. Run pending migrations: `npm run migration:run`
3. If issues persist, you may need to manually sync or reset

### Reverting changes
To revert a problematic migration:
```bash
npm run migration:revert
```

Note: Only the last executed migration can be reverted.

