import "reflect-metadata";
import { AppDataSource } from "../data-source";

async function migrate() {
  try {
    console.log("Initializing database connection...");
    await AppDataSource.initialize();

    console.log("Running pending migrations...");
    await AppDataSource.runMigrations();

    console.log("Migrations completed successfully!");
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

migrate();









