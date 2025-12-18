import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActionableItem1765942902262 implements MigrationInterface {
    name = 'AddActionableItem1765942902262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "actionable_items" (
                "id" varchar PRIMARY KEY NOT NULL,
                "restaurantId" varchar NOT NULL,
                "title" text NOT NULL,
                "description" text,
                "completed" boolean NOT NULL DEFAULT false,
                "sourceType" varchar NOT NULL,
                "sourceId" varchar NOT NULL,
                "sourceText" varchar,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        
        await queryRunner.query(`
            ALTER TABLE "actionable_items" 
            ADD CONSTRAINT "FK_actionable_items_restaurant" 
            FOREIGN KEY ("restaurantId") 
            REFERENCES "restaurants"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "actionable_items" DROP CONSTRAINT "FK_actionable_items_restaurant"`);
        await queryRunner.query(`DROP TABLE "actionable_items"`);
    }
}





