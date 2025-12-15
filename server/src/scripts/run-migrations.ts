import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { MigrationExecutor } from "typeorm";

async function runMigrations() {
  try {
    console.log("Initializing database connection...");
    await AppDataSource.initialize();

    console.log("Running migrations...");
    const migrationExecutor = new MigrationExecutor(
      AppDataSource,
      AppDataSource.createQueryRunner()
    );

    const pendingMigrations = await migrationExecutor.getPendingMigrations();
    console.log(`Found ${pendingMigrations.length} pending migrations`);

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations. Database is up to date.");
      await AppDataSource.destroy();
      return;
    }

    await migrationExecutor.executePendingMigrations();

    console.log("Migrations completed successfully!");
    await AppDataSource.destroy();
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations();




