import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSubscriptionEndDateNullable1765893460163 implements MigrationInterface {
    name = 'UpdateSubscriptionEndDateNullable1765893460163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_feedback" DROP CONSTRAINT "FK_540817d4132d8729f6eb768355b"`);
        await queryRunner.query(`ALTER TABLE "external_reviews" DROP CONSTRAINT "FK_6b317cb25a01de0541494865b9d"`);
        await queryRunner.query(`ALTER TABLE "restaurant_auth" DROP CONSTRAINT "FK_3278f7b86317dc639b4dc8eb0c6"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_8efcb4b7bc1122ed19df1897d22"`);
        await queryRunner.query(`ALTER TABLE "google_integrations" DROP CONSTRAINT "FK_edb70da19d196863ca9ff0e9cf9"`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" DROP CONSTRAINT "FK_1883c072a47e49496b0bd70c60c"`);
        await queryRunner.query(`ALTER TABLE "ai_insights" DROP CONSTRAINT "FK_ae415ce88522191bace7653ef4b"`);
        await queryRunner.query(`ALTER TABLE "customer_feedback" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "external_reviews" ALTER COLUMN "syncedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "restaurant_auth" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "endDate" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "google_integrations" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "google_integrations" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "restaurants" ALTER COLUMN "socialKeywords" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "restaurants" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "restaurants" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "recommendations" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "recommendations" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "keyTopics" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "keyTopics" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "generatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "customer_feedback" ADD CONSTRAINT "FK_540817d4132d8729f6eb768355b" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "external_reviews" ADD CONSTRAINT "FK_6b317cb25a01de0541494865b9d" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant_auth" ADD CONSTRAINT "FK_3278f7b86317dc639b4dc8eb0c6" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_8efcb4b7bc1122ed19df1897d22" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "google_integrations" ADD CONSTRAINT "FK_edb70da19d196863ca9ff0e9cf9" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" ADD CONSTRAINT "FK_1883c072a47e49496b0bd70c60c" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ADD CONSTRAINT "FK_ae415ce88522191bace7653ef4b" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_insights" DROP CONSTRAINT "FK_ae415ce88522191bace7653ef4b"`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" DROP CONSTRAINT "FK_1883c072a47e49496b0bd70c60c"`);
        await queryRunner.query(`ALTER TABLE "google_integrations" DROP CONSTRAINT "FK_edb70da19d196863ca9ff0e9cf9"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_8efcb4b7bc1122ed19df1897d22"`);
        await queryRunner.query(`ALTER TABLE "restaurant_auth" DROP CONSTRAINT "FK_3278f7b86317dc639b4dc8eb0c6"`);
        await queryRunner.query(`ALTER TABLE "external_reviews" DROP CONSTRAINT "FK_6b317cb25a01de0541494865b9d"`);
        await queryRunner.query(`ALTER TABLE "customer_feedback" DROP CONSTRAINT "FK_540817d4132d8729f6eb768355b"`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "generatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "keyTopics" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "keyTopics" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "recommendations" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ALTER COLUMN "recommendations" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "restaurants" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "restaurants" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "restaurants" ALTER COLUMN "socialKeywords" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "google_integrations" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "google_integrations" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "endDate" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "restaurant_auth" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "external_reviews" ALTER COLUMN "syncedAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "customer_feedback" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "ai_insights" ADD CONSTRAINT "FK_ae415ce88522191bace7653ef4b" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meta_integrations" ADD CONSTRAINT "FK_1883c072a47e49496b0bd70c60c" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "google_integrations" ADD CONSTRAINT "FK_edb70da19d196863ca9ff0e9cf9" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_8efcb4b7bc1122ed19df1897d22" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant_auth" ADD CONSTRAINT "FK_3278f7b86317dc639b4dc8eb0c6" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "external_reviews" ADD CONSTRAINT "FK_6b317cb25a01de0541494865b9d" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_feedback" ADD CONSTRAINT "FK_540817d4132d8729f6eb768355b" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
