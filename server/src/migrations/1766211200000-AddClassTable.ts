import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClassTable1766211200000 implements MigrationInterface {
  name = "AddClassTable1766211200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create classes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "classes" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "teacherId" character varying NOT NULL,
        "organizationId" character varying,
        "qrCode" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_classes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_classes_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_classes_organization" FOREIGN KEY ("organizationId") 
          REFERENCES "organizations"("id") ON DELETE SET NULL
      )
    `);

    // Add classId column to student_feedback table
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      ADD COLUMN IF NOT EXISTS "classId" character varying
    `);

    // Add foreign key constraint for classId in student_feedback
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      ADD CONSTRAINT "FK_student_feedback_class" 
      FOREIGN KEY ("classId") 
      REFERENCES "classes"("id") ON DELETE SET NULL
    `);

    // Create index on classId for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_student_feedback_classId" 
      ON "student_feedback"("classId")
    `);

    // Create index on teacherId in classes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_classes_teacherId" 
      ON "classes"("teacherId")
    `);

    // Create index on organizationId in classes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_classes_organizationId" 
      ON "classes"("organizationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      DROP CONSTRAINT IF EXISTS "FK_student_feedback_class"
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_student_feedback_classId"
    `);

    // Drop classId column from student_feedback
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      DROP COLUMN IF EXISTS "classId"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_classes_organizationId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_classes_teacherId"
    `);

    // Drop classes table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "classes"
    `);
  }
}

