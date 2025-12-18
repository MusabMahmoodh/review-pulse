import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeamMembersAndAssignment1765943000000 implements MigrationInterface {
    name = 'AddTeamMembersAndAssignment1765943000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create team_members table
        await queryRunner.query(`
            CREATE TABLE "team_members" (
                "id" varchar PRIMARY KEY NOT NULL,
                "restaurantId" varchar NOT NULL,
                "name" varchar NOT NULL,
                "email" varchar,
                "phone" varchar,
                "role" varchar,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        
        await queryRunner.query(`
            ALTER TABLE "team_members" 
            ADD CONSTRAINT "FK_team_members_restaurant" 
            FOREIGN KEY ("restaurantId") 
            REFERENCES "restaurants"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        // Add assignedTo and deadline columns to actionable_items
        await queryRunner.query(`ALTER TABLE "actionable_items" ADD "assignedTo" varchar`);
        await queryRunner.query(`ALTER TABLE "actionable_items" ADD "deadline" TIMESTAMP`);
        
        await queryRunner.query(`
            ALTER TABLE "actionable_items" 
            ADD CONSTRAINT "FK_actionable_items_team_member" 
            FOREIGN KEY ("assignedTo") 
            REFERENCES "team_members"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "actionable_items" DROP CONSTRAINT "FK_actionable_items_team_member"`);
        await queryRunner.query(`ALTER TABLE "actionable_items" DROP COLUMN "deadline"`);
        await queryRunner.query(`ALTER TABLE "actionable_items" DROP COLUMN "assignedTo"`);
        await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_team_members_restaurant"`);
        await queryRunner.query(`DROP TABLE "team_members"`);
    }
}



