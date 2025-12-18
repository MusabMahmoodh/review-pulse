import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewPageSettings1765938971542 implements MigrationInterface {
    name = 'AddReviewPageSettings1765938971542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "review_page_settings" (
                "restaurantId" varchar PRIMARY KEY NOT NULL,
                "welcomeMessage" text NOT NULL DEFAULT 'We Value Your Feedback',
                "primaryColor" varchar(7) NOT NULL DEFAULT '#3b82f6',
                "secondaryColor" varchar(7) NOT NULL DEFAULT '#1e40af',
                "backgroundColor" varchar(7) NOT NULL DEFAULT '#f3f4f6',
                "designVariation" varchar(20) NOT NULL DEFAULT 'default',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        
        await queryRunner.query(`
            ALTER TABLE "review_page_settings" 
            ADD CONSTRAINT "FK_review_page_settings_restaurant" 
            FOREIGN KEY ("restaurantId") 
            REFERENCES "restaurants"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review_page_settings" DROP CONSTRAINT "FK_review_page_settings_restaurant"`);
        await queryRunner.query(`DROP TABLE "review_page_settings"`);
    }
}





