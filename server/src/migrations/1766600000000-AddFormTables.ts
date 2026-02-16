import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormTables1766600000000 implements MigrationInterface {
  name = "AddFormTables1766600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create forms table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "forms" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "isGeneral" boolean NOT NULL DEFAULT false,
        "teacherId" character varying,
        "organizationId" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_forms" PRIMARY KEY ("id"),
        CONSTRAINT "FK_forms_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_forms_organization" FOREIGN KEY ("organizationId") 
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_forms_scope" CHECK (
          ("teacherId" IS NOT NULL AND "organizationId" IS NULL) OR
          ("teacherId" IS NULL AND "organizationId" IS NOT NULL)
        )
      )
    `);

    // Create form_tags junction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "form_tags" (
        "id" character varying NOT NULL,
        "formId" character varying NOT NULL,
        "tagId" character varying NOT NULL,
        CONSTRAINT "PK_form_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_form_tags_form" FOREIGN KEY ("formId") 
          REFERENCES "forms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_form_tags_tag" FOREIGN KEY ("tagId") 
          REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_form_tags_unique" UNIQUE ("formId", "tagId")
      )
    `);

    // Add formId column to student_feedback table
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      ADD COLUMN IF NOT EXISTS "formId" character varying
    `);

    // Add foreign key constraint for formId in student_feedback
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      ADD CONSTRAINT "FK_student_feedback_form" 
      FOREIGN KEY ("formId") 
      REFERENCES "forms"("id") ON DELETE SET NULL
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_forms_teacherId" 
      ON "forms"("teacherId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_forms_organizationId" 
      ON "forms"("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_forms_isGeneral" 
      ON "forms"("isGeneral")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_student_feedback_formId" 
      ON "student_feedback"("formId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_feedback_formId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forms_isGeneral"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forms_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_forms_teacherId"`);

    // Drop foreign key constraint for formId in student_feedback
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      DROP CONSTRAINT IF EXISTS "FK_student_feedback_form"
    `);

    // Drop column from student_feedback
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      DROP COLUMN IF EXISTS "formId"
    `);

    // Drop form_tags table
    await queryRunner.query(`DROP TABLE IF EXISTS "form_tags" CASCADE`);

    // Drop forms table
    await queryRunner.query(`DROP TABLE IF EXISTS "forms" CASCADE`);
  }
}






