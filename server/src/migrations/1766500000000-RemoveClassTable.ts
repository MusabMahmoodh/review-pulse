import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveClassTable1766500000000 implements MigrationInterface {
  name = "RemoveClassTable1766500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint for classId in student_feedback
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      DROP CONSTRAINT IF EXISTS "FK_student_feedback_class"
    `);

    // Drop index on classId
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_student_feedback_classId"
    `);

    // Drop classId column from student_feedback
    await queryRunner.query(`
      ALTER TABLE "student_feedback" 
      DROP COLUMN IF EXISTS "classId"
    `);

    // Drop indexes on classes table
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate classes table
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

    // Recreate indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_classes_teacherId" 
      ON "classes"("teacherId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_classes_organizationId" 
      ON "classes"("organizationId")
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
  }
}

