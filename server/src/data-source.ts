import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { Organization } from "./models/Organization";
import { OrganizationAuth } from "./models/OrganizationAuth";
import { Teacher } from "./models/Teacher";
import { TeacherAuth } from "./models/TeacherAuth";
import { StudentFeedback } from "./models/StudentFeedback";
import { ExternalReview } from "./models/ExternalReview";
import { AIInsight } from "./models/AIInsight";
import { Admin } from "./models/Admin";
import { Subscription } from "./models/Subscription";
import { ReviewPageSettings } from "./models/ReviewPageSettings";
import { ActionableItem } from "./models/ActionableItem";
import { TeamMember } from "./models/TeamMember";

// Load environment variables before creating DataSource
dotenv.config();

// Determine if we're connecting to a cloud database (Neon, Supabase, etc.)
const isCloudDB = process.env.DB_HOST?.includes("neon.tech") || 
                  process.env.DB_HOST?.includes("supabase.co");

// Build connection options
const connectionOptions: any = {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "your_db_user",
    password: process.env.DB_PASSWORD || "your_db_password",
    database: process.env.DB_NAME || "your_database_name",
    synchronize: false, // Always use migrations, never synchronize in production
    logging: process.env.NODE_ENV === "development",
    entities: [
        Organization,
        OrganizationAuth,
        Teacher,
        TeacherAuth,
        StudentFeedback,
        ExternalReview,
        AIInsight,
        Admin,
        Subscription,
        ReviewPageSettings,
        ActionableItem,
        TeamMember,
    ],
    migrations: [__dirname + "/migrations/**/*.ts"],
    migrationsTableName: "migrations",
    subscribers: [],
};

// Cloud databases (Neon, Supabase) require SSL connections
if (isCloudDB) {
    connectionOptions.ssl = {
        rejectUnauthorized: false
    };
    // Additional connection options for cloud databases
    connectionOptions.extra = {
        ssl: {
            rejectUnauthorized: false
        },
        // Increase connection timeout for cloud databases
        connectionTimeoutMillis: 10000,
    };
}

export const AppDataSource = new DataSource(connectionOptions);
