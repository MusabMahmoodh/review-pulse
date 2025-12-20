import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationLevelSupport1766400000000 implements MigrationInterface {
  name = "AddOrganizationLevelSupport1766400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update student_feedback table
    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      ALTER COLUMN "teacherId" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      ADD COLUMN IF NOT EXISTS "organizationId" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      ADD CONSTRAINT "FK_student_feedback_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      ADD CONSTRAINT "CHK_student_feedback_scope" CHECK (
        ("teacherId" IS NOT NULL AND "organizationId" IS NULL) OR
        ("teacherId" IS NULL AND "organizationId" IS NOT NULL)
      )
    `);

    // Update ai_insights table
    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      ALTER COLUMN "teacherId" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      ADD COLUMN IF NOT EXISTS "organizationId" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      ADD CONSTRAINT "FK_ai_insights_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      ADD CONSTRAINT "CHK_ai_insights_scope" CHECK (
        ("teacherId" IS NOT NULL AND "organizationId" IS NULL) OR
        ("teacherId" IS NULL AND "organizationId" IS NOT NULL)
      )
    `);

    // Update actionable_items table
    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      ALTER COLUMN "teacherId" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      ADD COLUMN IF NOT EXISTS "organizationId" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      ADD CONSTRAINT "FK_actionable_items_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      ADD CONSTRAINT "CHK_actionable_items_scope" CHECK (
        ("teacherId" IS NOT NULL AND "organizationId" IS NULL) OR
        ("teacherId" IS NULL AND "organizationId" IS NOT NULL)
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_student_feedback_organizationId" 
      ON "student_feedback"("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_insights_organizationId" 
      ON "ai_insights"("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_actionable_items_organizationId" 
      ON "actionable_items"("organizationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_actionable_items_organizationId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ai_insights_organizationId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_student_feedback_organizationId"
    `);

    // Revert actionable_items table
    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      DROP CONSTRAINT IF EXISTS "CHK_actionable_items_scope"
    `);

    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      DROP CONSTRAINT IF EXISTS "FK_actionable_items_organization"
    `);

    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      DROP COLUMN IF EXISTS "organizationId"
    `);

    await queryRunner.query(`
      ALTER TABLE "actionable_items"
      ALTER COLUMN "teacherId" SET NOT NULL
    `);

    // Revert ai_insights table
    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      DROP CONSTRAINT IF EXISTS "CHK_ai_insights_scope"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      DROP CONSTRAINT IF EXISTS "FK_ai_insights_organization"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      DROP COLUMN IF EXISTS "organizationId"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights"
      ALTER COLUMN "teacherId" SET NOT NULL
    `);

    // Revert student_feedback table
    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      DROP CONSTRAINT IF EXISTS "CHK_student_feedback_scope"
    `);

    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      DROP CONSTRAINT IF EXISTS "FK_student_feedback_organization"
    `);

    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      DROP COLUMN IF EXISTS "organizationId"
    `);

    await queryRunner.query(`
      ALTER TABLE "student_feedback"
      ALTER COLUMN "teacherId" SET NOT NULL
    `);
  }
}

