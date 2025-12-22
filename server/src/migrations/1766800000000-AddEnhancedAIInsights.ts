import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnhancedAIInsights1766800000000 implements MigrationInterface {
  name = "AddEnhancedAIInsights1766800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add formId column to ai_insights table
    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      ADD COLUMN IF NOT EXISTS "formId" character varying
    `);

    // Add foreign key constraint for formId in ai_insights
    // Check if constraint already exists to avoid errors
    try {
      await queryRunner.query(`
        ALTER TABLE "ai_insights" 
        ADD CONSTRAINT "FK_ai_insights_form" 
        FOREIGN KEY ("formId") 
        REFERENCES "forms"("id") ON DELETE SET NULL
      `);
    } catch (error: any) {
      // Constraint might already exist, which is fine
      if (!error.message?.includes("already exists")) {
        throw error;
      }
    }

    // Add enhanced insight JSONB columns
    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      ADD COLUMN IF NOT EXISTS "executiveSummary" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      ADD COLUMN IF NOT EXISTS "performanceMetrics" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      ADD COLUMN IF NOT EXISTS "keyStrengths" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      ADD COLUMN IF NOT EXISTS "areasForImprovement" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      ADD COLUMN IF NOT EXISTS "studentStruggles" jsonb
    `);

    // Create index for formId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_insights_formId" 
      ON "ai_insights"("formId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_insights_formId"`);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      DROP COLUMN IF EXISTS "studentStruggles"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      DROP COLUMN IF EXISTS "areasForImprovement"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      DROP COLUMN IF EXISTS "keyStrengths"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      DROP COLUMN IF EXISTS "performanceMetrics"
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      DROP COLUMN IF EXISTS "executiveSummary"
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      DROP CONSTRAINT IF EXISTS "FK_ai_insights_form"
    `);

    // Drop formId column
    await queryRunner.query(`
      ALTER TABLE "ai_insights" 
      DROP COLUMN IF EXISTS "formId"
    `);
  }
}

