import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { Restaurant } from "./models/Restaurant";
import { RestaurantAuth } from "./models/RestaurantAuth";
import { CustomerFeedback } from "./models/CustomerFeedback";
import { ExternalReview } from "./models/ExternalReview";
import { AIInsight } from "./models/AIInsight";
import { Admin } from "./models/Admin";
import { Subscription } from "./models/Subscription";
import { GoogleIntegration } from "./models/GoogleIntegration";

// Load environment variables before creating DataSource
dotenv.config();

// Replace with your actual database credentials
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "your_db_user",
    password: process.env.DB_PASSWORD || "your_db_password",
    database: process.env.DB_NAME || "your_database_name",
    synchronize: false, // Always use migrations, never synchronize in production
    logging: process.env.NODE_ENV === "development",
    entities: [
        Restaurant,
        RestaurantAuth,
        CustomerFeedback,
        ExternalReview,
        AIInsight,
        Admin,
        Subscription,
        GoogleIntegration,
    ],
    migrations: [__dirname + "/migrations/**/*.ts"],
    migrationsTableName: "migrations",
    subscribers: [],
});