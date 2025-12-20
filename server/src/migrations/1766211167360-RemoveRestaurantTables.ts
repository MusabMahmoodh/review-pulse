import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration to remove restaurant-related tables that are no longer needed
 * This migration drops: restaurants, restaurant_auth, customer_feedback tables
 * 
 * Note: This migration assumes you've already migrated any data you need
 * from restaurant tables to teacher/organization tables if applicable.
 */
export class RemoveRestaurantTables1766211167360 implements MigrationInterface {
  name = "RemoveRestaurantTables1766211167360";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop restaurant-related tables if they exist
    // Note: Drop in order to respect foreign key constraints
    
    // Drop customer_feedback table first (has foreign key to restaurants)
    await queryRunner.query(`
      DROP TABLE IF EXISTS "customer_feedback" CASCADE
    `);

    // Drop restaurant_auth table (has foreign key to restaurants)
    await queryRunner.query(`
      DROP TABLE IF EXISTS "restaurant_auth" CASCADE
    `);

    // Drop restaurants table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "restaurants" CASCADE
    `);

    // Drop any indexes related to restaurants if they exist
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_feedback_restaurantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_feedback_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_restaurants_email"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate restaurant tables if needed to rollback
    // Note: This is a basic recreation - adjust fields as needed
    
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "restaurants" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "address" character varying NOT NULL,
        "qrCode" character varying NOT NULL,
        "socialKeywords" text NOT NULL DEFAULT '',
        "googlePlaceId" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_restaurants_email" UNIQUE ("email"),
        CONSTRAINT "PK_restaurants" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "restaurant_auth" (
        "restaurantId" character varying NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restaurant_auth" PRIMARY KEY ("restaurantId"),
        CONSTRAINT "FK_restaurant_auth_restaurant" FOREIGN KEY ("restaurantId") 
          REFERENCES "restaurants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_feedback" (
        "id" character varying NOT NULL,
        "restaurantId" character varying NOT NULL,
        "customerName" character varying,
        "customerContact" character varying,
        "foodRating" integer NOT NULL,
        "staffRating" integer NOT NULL,
        "ambienceRating" integer NOT NULL,
        "overallRating" integer NOT NULL,
        "suggestions" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_feedback_restaurant" FOREIGN KEY ("restaurantId") 
          REFERENCES "restaurants"("id") ON DELETE CASCADE
      )
    `);

    // Recreate indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_feedback_restaurantId" ON "customer_feedback" ("restaurantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_feedback_createdAt" ON "customer_feedback" ("createdAt")`);
  }
}

