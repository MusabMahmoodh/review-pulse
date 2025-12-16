import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentFieldsToSubscription1765898793854 implements MigrationInterface {
    name = 'AddPaymentFieldsToSubscription1765898793854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "defaultPrice" numeric(10,2) NOT NULL DEFAULT '15000'`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "discount" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "finalPrice" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "amountPaid" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "amountPaid"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "finalPrice"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "defaultPrice"`);
    }

}
