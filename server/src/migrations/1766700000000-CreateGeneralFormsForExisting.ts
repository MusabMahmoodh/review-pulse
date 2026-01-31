import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration to create general forms for all existing teachers and organizations
 * that don't already have one
 */
export class CreateGeneralFormsForExisting1766700000000 implements MigrationInterface {
  name = "CreateGeneralFormsForExisting1766700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all teachers without a general form
    const teachersWithoutForm = await queryRunner.query(`
      SELECT t.id, t."organizationId"
      FROM teachers t
      WHERE NOT EXISTS (
        SELECT 1 FROM forms f
        WHERE f."teacherId" = t.id AND f."isGeneral" = true
      )
    `);

    // Create general forms for teachers
    for (const teacher of teachersWithoutForm) {
      const formId = `form_general_${teacher.id}_${Date.now()}`;
      await queryRunner.query(`
        INSERT INTO forms (id, name, description, "isGeneral", "teacherId", "organizationId", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        formId,
        "General Feedback Form",
        "Default feedback form for collecting student feedback",
        true,
        teacher.id,
        null,
        true,
      ]);
    }

    // Get all organizations without a general form
    const orgsWithoutForm = await queryRunner.query(`
      SELECT o.id
      FROM organizations o
      WHERE NOT EXISTS (
        SELECT 1 FROM forms f
        WHERE f."organizationId" = o.id AND f."isGeneral" = true
      )
    `);

    // Create general forms for organizations
    for (const org of orgsWithoutForm) {
      const formId = `form_general_${org.id}_${Date.now()}`;
      await queryRunner.query(`
        INSERT INTO forms (id, name, description, "isGeneral", "teacherId", "organizationId", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        formId,
        "General Feedback Form",
        "Default feedback form for collecting student feedback",
        true,
        null,
        org.id,
        true,
      ]);
    }

    console.log(`Created general forms for ${teachersWithoutForm.length} teachers and ${orgsWithoutForm.length} organizations`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all general forms (optional - you might not want to do this)
    await queryRunner.query(`
      DELETE FROM forms WHERE "isGeneral" = true
    `);
  }
}




