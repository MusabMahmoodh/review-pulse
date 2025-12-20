import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1735689600000 implements MigrationInterface {
  name = "InitialMigration1735689600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "address" character varying NOT NULL,
        "website" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_organizations_email" UNIQUE ("email"),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);

    // Create organization_auth table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_auth" (
        "organizationId" character varying NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organization_auth" PRIMARY KEY ("organizationId"),
        CONSTRAINT "FK_organization_auth_organization" FOREIGN KEY ("organizationId") 
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // Create teachers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "teachers" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "address" character varying,
        "subject" character varying,
        "department" character varying,
        "qrCode" character varying NOT NULL,
        "organizationId" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_teachers_email" UNIQUE ("email"),
        CONSTRAINT "PK_teachers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_teachers_organization" FOREIGN KEY ("organizationId") 
          REFERENCES "organizations"("id") ON DELETE SET NULL
      )
    `);

    // Create teacher_auth table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "teacher_auth" (
        "teacherId" character varying NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teacher_auth" PRIMARY KEY ("teacherId"),
        CONSTRAINT "FK_teacher_auth_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create student_feedback table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_feedback" (
        "id" character varying NOT NULL,
        "teacherId" character varying NOT NULL,
        "studentName" character varying,
        "studentContact" character varying,
        "studentId" character varying,
        "teachingRating" integer NOT NULL,
        "communicationRating" integer NOT NULL,
        "materialRating" integer NOT NULL,
        "overallRating" integer NOT NULL,
        "suggestions" text,
        "courseName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "FK_student_feedback_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create external_reviews table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "external_reviews" (
        "id" character varying NOT NULL,
        "teacherId" character varying NOT NULL,
        "platform" character varying NOT NULL,
        "author" character varying NOT NULL,
        "rating" integer NOT NULL,
        "comment" text NOT NULL,
        "reviewDate" TIMESTAMP NOT NULL,
        "syncedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_external_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_external_reviews_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create ai_insights table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_insights" (
        "id" character varying NOT NULL,
        "teacherId" character varying NOT NULL,
        "summary" text NOT NULL,
        "recommendations" text NOT NULL,
        "sentiment" character varying NOT NULL,
        "keyTopics" text NOT NULL,
        "generatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_insights" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_insights_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create actionable_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "actionable_items" (
        "id" character varying NOT NULL,
        "teacherId" character varying NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "completed" boolean NOT NULL DEFAULT false,
        "sourceType" character varying NOT NULL,
        "sourceId" character varying NOT NULL,
        "sourceText" text,
        "assignedTo" character varying,
        "deadline" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_actionable_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_actionable_items_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" character varying NOT NULL,
        "organizationId" character varying,
        "teacherId" character varying,
        "plan" character varying NOT NULL,
        "status" character varying NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "monthlyPrice" numeric(10,2) NOT NULL,
        "defaultPrice" numeric(10,2) NOT NULL DEFAULT 15000,
        "discount" numeric(10,2),
        "finalPrice" numeric(10,2),
        "amountPaid" numeric(10,2),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_organization" FOREIGN KEY ("organizationId") 
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create review_page_settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review_page_settings" (
        "teacherId" character varying NOT NULL,
        "welcomeMessage" text NOT NULL DEFAULT 'We Value Your Feedback',
        "primaryColor" character varying(7) NOT NULL DEFAULT '#3b82f6',
        "secondaryColor" character varying(7) NOT NULL DEFAULT '#1e40af',
        "backgroundColor" character varying(7) NOT NULL DEFAULT '#f3f4f6',
        "designVariation" character varying(20) NOT NULL DEFAULT 'default',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_page_settings" PRIMARY KEY ("teacherId"),
        CONSTRAINT "FK_review_page_settings_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create team_members table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "team_members" (
        "id" character varying NOT NULL,
        "organizationId" character varying,
        "teacherId" character varying NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying,
        "phone" character varying,
        "role" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_members" PRIMARY KEY ("id"),
        CONSTRAINT "FK_team_members_organization" FOREIGN KEY ("organizationId") 
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_team_members_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE
      )
    `);

    // Create admins table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id" character varying NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "role" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_admins_email" UNIQUE ("email"),
        CONSTRAINT "PK_admins" PRIMARY KEY ("id")
      )
    `);

    // Create migrations table (for tracking migrations)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL NOT NULL,
        "timestamp" bigint NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "PK_migrations" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_student_feedback_teacherId" ON "student_feedback" ("teacherId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_student_feedback_createdAt" ON "student_feedback" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_external_reviews_teacherId" ON "external_reviews" ("teacherId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_external_reviews_platform" ON "external_reviews" ("platform")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ai_insights_teacherId" ON "ai_insights" ("teacherId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_actionable_items_teacherId" ON "actionable_items" ("teacherId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_actionable_items_completed" ON "actionable_items" ("completed")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_teachers_organizationId" ON "teachers" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_organizationId" ON "subscriptions" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_teacherId" ON "subscriptions" ("teacherId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscriptions_status" ON "subscriptions" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_teacherId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teachers_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_actionable_items_completed"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_actionable_items_teacherId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_insights_teacherId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_external_reviews_platform"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_external_reviews_teacherId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_feedback_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_feedback_teacherId"`);

    // Drop tables in reverse order (respecting foreign key constraints)
    await queryRunner.query(`DROP TABLE IF EXISTS "migrations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "team_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_page_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "actionable_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_insights"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "external_reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_feedback"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_auth"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teachers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_auth"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
  }
}
