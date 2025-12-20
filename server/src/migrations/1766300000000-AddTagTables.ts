import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagTables1766300000000 implements MigrationInterface {
  name = "AddTagTables1766300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tags table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "color" character varying,
        "teacherId" character varying,
        "organizationId" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tags_teacher" FOREIGN KEY ("teacherId") 
          REFERENCES "teachers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tags_organization" FOREIGN KEY ("organizationId") 
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_tags_scope" CHECK (
          ("teacherId" IS NOT NULL AND "organizationId" IS NULL) OR
          ("teacherId" IS NULL AND "organizationId" IS NOT NULL)
        )
      )
    `);

    // Create feedback_tags junction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feedback_tags" (
        "id" character varying NOT NULL,
        "feedbackId" character varying NOT NULL,
        "tagId" character varying NOT NULL,
        CONSTRAINT "PK_feedback_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_feedback_tags_feedback" FOREIGN KEY ("feedbackId") 
          REFERENCES "student_feedback"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_feedback_tags_tag" FOREIGN KEY ("tagId") 
          REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_feedback_tags_unique" UNIQUE ("feedbackId", "tagId")
      )
    `);

    // Create external_review_tags junction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "external_review_tags" (
        "id" character varying NOT NULL,
        "reviewId" character varying NOT NULL,
        "tagId" character varying NOT NULL,
        CONSTRAINT "PK_external_review_tags" PRIMARY KEY ("id"),
        CONSTRAINT "FK_external_review_tags_review" FOREIGN KEY ("reviewId") 
          REFERENCES "external_reviews"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_external_review_tags_tag" FOREIGN KEY ("tagId") 
          REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_external_review_tags_unique" UNIQUE ("reviewId", "tagId")
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tags_teacherId" 
      ON "tags"("teacherId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tags_organizationId" 
      ON "tags"("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_tags_isActive" 
      ON "tags"("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feedback_tags_feedbackId" 
      ON "feedback_tags"("feedbackId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_feedback_tags_tagId" 
      ON "feedback_tags"("tagId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_external_review_tags_reviewId" 
      ON "external_review_tags"("reviewId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_external_review_tags_tagId" 
      ON "external_review_tags"("tagId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_external_review_tags_tagId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_external_review_tags_reviewId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_feedback_tags_tagId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_feedback_tags_feedbackId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tags_isActive"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tags_organizationId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tags_teacherId"
    `);

    // Drop tables
    await queryRunner.query(`
      DROP TABLE IF EXISTS "external_review_tags"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "feedback_tags"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "tags"
    `);
  }
}

